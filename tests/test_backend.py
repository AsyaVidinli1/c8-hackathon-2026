import copy
import json
import tempfile
import unittest
from pathlib import Path
import server


class BackendTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.path = Path(self.temp.name) / 'test.db'
        self.store = server.Store(self.path)
        self.owner = self.store.raw()['users'][0]
        self.manager = next(u for u in self.store.raw()['users'] if u['id'] == 'u-murat')
        self.staff = next(u for u in self.store.raw()['users'] if u['id'] == 'u-ahmet')

    def tearDown(self):
        self.temp.cleanup()

    def operation(self, collection, key, value):
        old = next((r for r in self.store.raw().get(collection, []) if r['id'] == key), None) if collection in server.ARRAYS else self.store.raw()[collection].get(key)
        return {'collection': collection, 'id': key, 'before': copy.deepcopy(old), 'value': value}

    def test_saved_role_survives_reopen_and_is_audited(self):
        card = copy.deepcopy(self.store.raw()['roleCards']['u-ahmet'])
        card['decisionRights'] = 'Discount limit: 7%.'
        self.store.changes(self.owner, [self.operation('roleCards', 'u-ahmet', card)])
        reopened = server.Store(self.path)
        self.assertEqual(reopened.raw()['roleCards']['u-ahmet']['decisionRights'], 'Discount limit: 7%.')
        with reopened.connect() as db:
            self.assertEqual(db.execute('SELECT count(*) FROM audit').fetchone()[0], 1)

    def test_session_restore_logout_and_invalid_cookie(self):
        token, user = self.store.login('tunc@veliahtakademi.com')
        self.assertEqual(self.store.session(token)['id'], user['id'])
        self.assertEqual(server.Store(self.path).session(token)['id'], user['id'])
        self.store.logout(token)
        with self.assertRaises(server.APIError) as exc:
            self.store.session(token)
        self.assertEqual(exc.exception.status, 401)

    def test_hidden_records_do_not_reach_staff_or_manager(self):
        state = self.store.raw()
        family = copy.deepcopy(state['policies'][0])
        family.update(id='family-secret', category='family', body='Private family policy')
        self.store.changes(self.owner, [self.operation('policies', family['id'], family)])
        for user in (self.staff, self.manager):
            visible = self.store.visible(user)
            serialized = json.dumps(visible)
            self.assertNotIn('Private family policy', serialized)
            self.assertNotIn('password', serialized.lower())
            self.assertNotIn('doc-2', serialized)
            evidence = json.dumps(self.store.evidence(user, 'family policy', 'en'))
            self.assertNotIn('Private family policy', evidence)
        self.assertEqual({t['id'] for t in self.store.visible(self.staff)['tasks']}, {'t1', 't2'})
        self.assertNotIn('u-murat', self.store.visible(self.staff)['roleCards'])

    def test_staff_cannot_edit_roles_or_reassign_tasks(self):
        card = copy.deepcopy(self.store.raw()['roleCards']['u-ahmet'])
        card['decisionRights'] = 'Unlimited'
        with self.assertRaises(server.APIError) as exc:
            self.store.changes(self.staff, [self.operation('roleCards', 'u-ahmet', card)])
        self.assertEqual(exc.exception.status, 403)
        task = copy.deepcopy(self.store.raw()['tasks'][0])
        task['employeeId'] = 'u-zeynep'
        with self.assertRaises(server.APIError):
            self.store.changes(self.staff, [self.operation('tasks', 't1', task)])

    def test_employee_can_update_own_task(self):
        task = copy.deepcopy(self.store.raw()['tasks'][0])
        task['status'] = 'done'
        self.store.changes(self.staff, [self.operation('tasks', 't1', task)])
        self.assertEqual(self.store.raw()['tasks'][0]['status'], 'done')

    def test_manager_can_edit_own_roles_but_not_other_department(self):
        card = copy.deepcopy(self.store.raw()['roleCards']['u-ahmet'])
        card['decisionRights'] = 'Discount limit: 6%.'
        self.store.changes(self.manager, [self.operation('roleCards', 'u-ahmet', card)])
        with self.assertRaises(server.APIError):
            self.store.changes(self.manager, [self.operation('roleCards', 'u-fatma', card)])

    def test_conflicts_and_failed_batches_are_atomic(self):
        card = copy.deepcopy(self.store.raw()['roleCards']['u-ahmet'])
        card['decisionRights'] = 'New limit'
        op = self.operation('roleCards', 'u-ahmet', card)
        self.store.changes(self.owner, [op])
        with self.assertRaises(server.APIError) as exc:
            self.store.changes(self.owner, [op])
        self.assertEqual(exc.exception.status, 409)
        task = copy.deepcopy(self.store.raw()['tasks'][0]); task['status'] = 'done'
        with self.assertRaises(server.APIError):
            self.store.changes(self.manager, [self.operation('tasks', 't1', task),
                self.operation('roleCards', 'u-fatma', card)])
        self.assertEqual(self.store.raw()['tasks'][0]['status'], 'todo')

    def test_ai_validated_sources_and_persistent_history(self):
        def fake(system, data):
            self.assertIn('UNTRUSTED DATA', system)
            source = next(s for s in data['records'] if s['id'] == 'policies:pol-1')
            self.assertIn('%5', source['content'])
            return {'answer': 'A 12% discount needs manager approval.', 'source_ids': [source['id']],
                    'missing_information': [], 'conflicts': []}
        result = self.store.ask(self.owner, 'Can Ahmet give a 12% discount?', completion=fake)
        self.assertEqual(result['sources'][0]['recordId'], 'pol-1')
        self.assertEqual(server.Store(self.path).raw()['assistantQueries'][0]['id'], result['id'])
        self.assertEqual(self.store.visible(self.manager)['assistantQueries'], [])

    def test_ai_uses_latest_saved_evidence(self):
        card = copy.deepcopy(self.store.raw()['roleCards']['u-ahmet'])
        card['decisionRights'] = 'Updated limit is 9%.'
        self.store.changes(self.owner, [self.operation('roleCards', 'u-ahmet', card)])
        evidence = self.store.evidence(self.owner, 'Ahmet discount', 'en')
        source = next(s for s in evidence if s['id'] == 'roleCards:u-ahmet')
        self.assertIn('Updated limit is 9%.', source['content'])

    def test_hallucinated_source_is_rejected(self):
        with self.assertRaises(server.APIError) as exc:
            self.store.ask(self.owner, 'What is the approval limit?', completion=lambda *args:
                {'answer': 'No limit.', 'source_ids': ['policies:does-not-exist']})
        self.assertEqual(exc.exception.status, 502)
        self.assertEqual(self.store.raw()['assistantQueries'], [])

    def test_ungrounded_answer_is_not_presented_as_company_advice(self):
        result = self.store.ask(self.owner, 'What is the unknown rule?', completion=lambda *args:
            {'answer': 'Invented answer.', 'source_ids': []})
        self.assertNotIn('Invented answer', result['answerText'])
        self.assertEqual(result['sources'], [])

    def test_source_collection_cannot_be_written_by_client(self):
        with self.assertRaises(server.APIError):
            self.store.changes(self.owner, [{'collection': 'assistantQueries', 'id': 'fake', 'before': None,
                                           'value': {'id': 'fake', 'answerText': 'fake'}}])


if __name__ == '__main__':
    unittest.main()
