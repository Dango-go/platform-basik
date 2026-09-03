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

  async login(email: string, password: string): Promise<{ access_token: string }> {
    const res = await fetch('/api/v1/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      let message = `Server error (${res.status})`;
      if (typeof errData.detail === 'string') {
        message = errData.detail;
      } else if (Array.isArray(errData.detail) && errData.detail.length > 0) {
        message = errData.detail.map((e: any) => e.msg || 'Invalid input').join(', ');
      }
      throw new Error(message);
    }

    const data = await res.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user_email', email);
    return data;
  }

  async register(email: string, password: string): Promise<{ id: string; email: string }> {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      let message = `Registration failed (${res.status})`;
      if (typeof errData.detail === 'string') {
        message = errData.detail;
      } else if (Array.isArray(errData.detail) && errData.detail.length > 0) {
        message = errData.detail.map((e: any) => e.msg || 'Invalid input').join(', ');
      }
      throw new Error(message);
    }

    return await res.json();
  }
}

export const apiClient = new ApiClient();
