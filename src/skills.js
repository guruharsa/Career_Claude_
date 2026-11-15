const SKILLS = ['python','java','javascript','typescript','react','node.js','express','next.js','vue','angular','sql','postgresql','postgis','mysql','sql server','oracle','mongodb','redis','elasticsearch','snowflake','databricks','aws','sagemaker','bedrock','lambda','azure','gcp','docker','kubernetes','terraform','git','github actions','linux','bash','c++','c#','.net','golang','rust','scala','php','ruby','swift','kotlin','matlab','django','flask','fastapi','streamlit','spring boot','celery','rabbitmq','kafka','spark','airflow','dbt','tensorflow','pytorch','keras','scikit-learn','pandas','numpy','opencv','yolo','hugging face','transformers','langchain','rag','mlops','machine learning','deep learning','computer vision','nlp','llm','generative ai','tableau','power bi','microsoft excel','jenkins','ci/cd','graphql','rest api','redux','tailwind','html','css','android','ios','flutter','agile','scrum','jira','figma','selenium','pytest','gis','arcgis','qgis','geopandas','gdal','leaflet','openlayers'];
export const DOCS = {
  python: 'https://docs.python.org/3/tutorial/', docker: 'https://docs.docker.com/get-started/',
  kubernetes: 'https://kubernetes.io/docs/tutorials/', react: 'https://react.dev/learn',
  typescript: 'https://www.typescriptlang.org/docs/', sql: 'https://www.postgresql.org/docs/current/tutorial.html',
  git: 'https://git-scm.com/doc', terraform: 'https://developer.hashicorp.com/terraform/tutorials',
  aws: 'https://docs.aws.amazon.com/', pytorch: 'https://pytorch.org/tutorials/',
  tensorflow: 'https://www.tensorflow.org/tutorials', fastapi: 'https://fastapi.tiangolo.com/tutorial/',
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function extractSkills(text = '') {
  const t = text.toLowerCase();
  return SKILLS.filter((s) => new RegExp(`(^|[^a-z0-9+#])${esc(s)}($|[^a-z0-9+#])`).test(t));
}
export function skillGap(jobText, mySkillsText) {
  const need = extractSkills(jobText);
  const mine = new Set(extractSkills(mySkillsText));
  const have = need.filter((s) => mine.has(s));
  const missing = need.filter((s) => !mine.has(s));
  return { need, have, missing, pct: need.length ? Math.round((have.length / need.length) * 100) : null };
}
