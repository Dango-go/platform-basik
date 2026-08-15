import { CATALOG_ITEMS, INITIAL_DEPLOYED_DBS, CLOUD_CREDENTIALS, K8S_CLUSTERS, METRICS_SAMPLE } from './mockData';
import { DatabaseCatalogItem, DeployedDatabase, CloudCredential, K8sCluster, DatabaseMetrics } from '../types';

class ApiClient {
  private useMock: boolean = true;
  private deployedDbs: DeployedDatabase[] = [...INITIAL_DEPLOYED_DBS];
  private credentials: CloudCredential[] = [...CLOUD_CREDENTIALS];
  private clusters: K8sCluster[] = [...K8S_CLUSTERS];

  async getCatalog(): Promise<DatabaseCatalogItem[]> {
    return Promise.resolve(CATALOG_ITEMS);
  }

  async getDeployedDatabases(): Promise<DeployedDatabase[]> {
    return Promise.resolve(this.deployedDbs);
  }

  async getCredentials(): Promise<CloudCredential[]> {
    return Promise.resolve(this.credentials);
  }

  async getClusters(): Promise<K8sCluster[]> {
    return Promise.resolve(this.clusters);
  }

  async getMetricsForDb(dbId: string): Promise<DatabaseMetrics> {
    return Promise.resolve({ ...METRICS_SAMPLE, db_id: dbId });
  }

  async deployDatabase(newDb: Omit<DeployedDatabase, 'id' | 'created_at' | 'status'>): Promise<DeployedDatabase> {
    const created: DeployedDatabase = {
      ...newDb,
      id: `db-${Date.now()}`,
      status: 'running',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    this.deployedDbs.unshift(created);
    return Promise.resolve(created);
  }

  async addCredential(cred: Omit<CloudCredential, 'id' | 'created_at' | 'status'>): Promise<CloudCredential> {
    const created: CloudCredential = {
      ...cred,
      id: `cred-${Date.now()}`,
      status: 'active',
      created_at: new Date().toISOString().substring(0, 10)
    };
    this.credentials.unshift(created);
    return Promise.resolve(created);
  }
}

export const apiClient = new ApiClient();
