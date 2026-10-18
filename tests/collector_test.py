"""Access-profile checks use tiny OSM-shaped fixtures, without network."""
import importlib.util,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('walk',Path(__file__).resolve().parents[1]/'scripts/collect_walk_graph.py')
walk=importlib.util.module_from_spec(spec);spec.loader.exec_module(walk)
class WalkingCollector(unittest.TestCase):
    def source(self,tags=None,node_tags=None):
        return {'bbox':[0,0,1,1],'collectedAt':'2026-10-18','nodes':[{'id':1,'lon':.1,'lat':.1,'tags':node_tags or {}},{'id':2,'lon':.2,'lat':.1,'tags':{}}],'ways':[{'id':10,'nodes':[1,2],'tags':tags or {'highway':'footway'}}]}
    def test_explicit_access_denials_and_conditions(self):
        for tags in [{'foot':'no'},{'access':'private'},{'foot':'destination'},{'foot':'use_sidepath'},{'access':'permit'},{'foot:conditional':'yes @ (Mo-Fr)'}]:
            self.assertEqual(walk.build(self.source({'highway':'footway',**tags}))['edges'],[],tags)
    def test_specific_foot_permission_overrides_general_access(self):
        self.assertEqual(len(walk.build(self.source({'highway':'footway','access':'private','foot':'yes'}))['edges']),1)
    def test_shared_roads_require_explicit_permission(self):
        self.assertEqual(walk.build(self.source({'highway':'service'}))['edges'],[])
        self.assertEqual(len(walk.build(self.source({'highway':'service','foot':'designated'}))['edges']),1)
    def test_unknown_gates_are_excluded(self):
        self.assertEqual(walk.build(self.source(node_tags={'barrier':'gate'}))['edges'],[])
        self.assertEqual(len(walk.build(self.source(node_tags={'barrier':'gate','foot':'yes'}))['edges']),1)
    def test_direction_and_steps_survive_export(self):
        edge=walk.build(self.source({'highway':'steps','oneway:foot':'-1'}))['edges'][0]
        self.assertEqual(edge[3:], [True,10,-1])
    def test_open_fences_remain_connector_obstacles(self):
        source=self.source();source['ways'].append({'id':11,'nodes':[1,2],'tags':{'barrier':'fence'}})
        obstacle=walk.build(source)['obstacles'][0];self.assertEqual(obstacle['kind'],'barrier');self.assertEqual(len(obstacle['points']),2)
if __name__=='__main__':unittest.main()
