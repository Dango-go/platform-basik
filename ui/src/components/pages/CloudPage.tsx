import React, { useState } from 'react';
import { CLOUD_CREDENTIALS, K8S_CLUSTERS } from '../../services/mockData';
import { CloudCredential, K8sCluster, CloudProviderType } from '../../types';
import { 
  Cloud, 
  Key, 
  Plus, 
  CheckCircle, 
  Server, 
  Globe, 
  X, 
  ListFilter,
  Trash2,
  Upload,
  AlertTriangle
} from 'lucide-react';

export const CloudPage: React.FC = () => {
  const [credentialsList, setCredentialsList] = useState<CloudCredential[]>(CLOUD_CREDENTIALS);
  const [clustersList, setClustersList] = useState<K8sCluster[]>(K8S_CLUSTERS);

  // Selected Provider filter: 'all' | 'none' | CloudProviderType
  const [selectedProviderFilter, setSelectedProviderFilter] = useState<CloudProviderType | 'all' | 'none'>('all');

  // Modal State for adding new credentials
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCredName, setNewCredName] = useState('');
  const [newCredProvider, setNewCredProvider] = useState<CloudProviderType>('aws');

  // Provider-specific input fields
  const [awsAccessKeyId, setAwsAccessKeyId] = useState('');
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState('');

  const [azureTenantId, setAzureTenantId] = useState('');
  const [azureClientId, setAzureClientId] = useState('');
  const [azureClientSecret, setAzureClientSecret] = useState('');
  const [azureSubscriptionId, setAzureSubscriptionId] = useState('');

  const [doPersonalAccessToken, setDoPersonalAccessToken] = useState('');
  const [gcpKeyJson, setGcpKeyJson] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Deletion Modal State
  const [credToDelete, setCredToDelete] = useState<CloudCredential | null>(null);

  // GCP File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setGcpKeyJson(content);
      };
      reader.readAsText(file);
    }
  };

  const handleAddCredential = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCredName) return;

    let accountId = 'default_id';
    if (newCredProvider === 'aws') accountId = awsAccessKeyId || 'AKIAIOSFODNN7EXAMPLE';
    if (newCredProvider === 'azure') accountId = azureTenantId || '72f988bf-86f1-41af-91ab-2d7cd011db47';
    if (newCredProvider === 'digitalocean') accountId = doPersonalAccessToken ? `${doPersonalAccessToken.substring(0, 12)}...` : 'do_pat_sample';
    if (newCredProvider === 'gcp') accountId = uploadedFileName || 'gcp-service-account.json';

    const newCred: CloudCredential = {
      id: `cred-${Date.now()}`,
      name: newCredName,
      provider: newCredProvider,
      account_id: accountId,
      created_at: new Date().toISOString().substring(0, 10),
      status: 'active',
      aws_access_key_id: awsAccessKeyId,
      aws_secret_access_key: awsSecretAccessKey,
      azure_tenant_id: azureTenantId,
      azure_client_id: azureClientId,
      azure_client_secret: azureClientSecret,
      azure_subscription_id: azureSubscriptionId,
      do_personal_access_token: doPersonalAccessToken
    };

    setCredentialsList([newCred, ...credentialsList]);
    setSelectedProviderFilter('all');
    setNewCredName('');
    setAwsAccessKeyId('');
    setAwsSecretAccessKey('');
    setAzureTenantId('');
    setAzureClientId('');
    setAzureClientSecret('');
    setAzureSubscriptionId('');
    setDoPersonalAccessToken('');
    setGcpKeyJson('');
    setUploadedFileName(null);
    setShowAddModal(false);
  };

  const confirmDeleteCredential = () => {
    if (credToDelete) {
      setCredentialsList(credentialsList.filter((c) => c.id !== credToDelete.id));
      setCredToDelete(null);
    }
  };

  // Toggle View All logic: if 'all' -> toggles to 'none' (dark, hidden). If 'none' or specific -> toggles to 'all' (active, visible)
  const toggleViewAll = () => {
    if (selectedProviderFilter === 'all') {
      setSelectedProviderFilter('none');
    } else {
      setSelectedProviderFilter('all');
    }
  };

  // High quality vector SVG logos
  const providersConfig: { id: CloudProviderType; name: string; icon: string; count: number }[] = [
    { 
      id: 'aws', 
      name: 'Amazon Web Services', 
      icon: 'https://www.vectorlogo.zone/logos/amazon_aws/amazon_aws-icon.svg',
      count: credentialsList.filter((c) => c.provider === 'aws').length 
    },
    { 
      id: 'azure', 
      name: 'Microsoft Azure', 
      icon: 'https://www.vectorlogo.zone/logos/microsoft_azure/microsoft_azure-icon.svg',
      count: credentialsList.filter((c) => c.provider === 'azure').length 
    },
    { 
      id: 'digitalocean', 
      name: 'DigitalOcean', 
      icon: 'https://www.vectorlogo.zone/logos/digitalocean/digitalocean-icon.svg',
      count: credentialsList.filter((c) => c.provider === 'digitalocean').length 
    },
    { 
      id: 'gcp', 
      name: 'Google Cloud Platform', 
      icon: 'https://www.vectorlogo.zone/logos/google_cloud/google_cloud-icon.svg',
      count: credentialsList.filter((c) => c.provider === 'gcp').length 
    },
  ];

  const filteredCredentials = selectedProviderFilter === 'all'
    ? credentialsList
    : selectedProviderFilter === 'none'
    ? []
    : credentialsList.filter((c) => c.provider === selectedProviderFilter);

  return (
    <div className="space-y-8 text-slate-100">
      
      {/* 1. CLOUD PROVIDERS IN SQUARE CARDS WITH VECTOR LOGOS */}
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Cloud className="w-5 h-5 text-brand-sky" />
            Cloud Infrastructure Providers
          </h3>
          <p className="text-xs text-slate-400">Click on any cloud provider card below to filter its specific credentials</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {providersConfig.map((prov) => {
            const isSelected = selectedProviderFilter === prov.id;
            return (
              <div
                key={prov.id}
                onClick={() => setSelectedProviderFilter(prov.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-brand-blue/20 border-brand-sky ring-2 ring-brand-sky/30 shadow-xl'
                    : 'bg-bg-card border-accent-darkBorder hover:border-brand-sky hover:bg-accent-darkHover'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-bg-main p-2 flex items-center justify-center border border-accent-darkBorder">
                    <img src={prov.icon} alt={prov.name} className="w-8 h-8 object-contain" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-bg-main text-brand-sky border border-accent-darkBorder">
                    {prov.count} Creds
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">{prov.name}</h4>
                  <span className="text-xs text-slate-400 mt-0.5 block">Click to view credentials</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. CREDENTIALS LIST SECTION WITH TOGGLE "VIEW ALL" BUTTON */}
      <section className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-accent-darkBorder pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-brand-sky" />
              Cloud Credentials List {selectedProviderFilter !== 'all' && selectedProviderFilter !== 'none' && `(${selectedProviderFilter.toUpperCase()})`}
            </h3>
            <p className="text-xs text-slate-400">Manage encrypted API tokens & secret access keys for cluster provisioning</p>
          </div>

          <div className="flex items-center gap-3">
            {/* TOGGLE VIEW ALL BUTTON */}
            <button
              onClick={toggleViewAll}
              className={`text-xs font-semibold px-3.5 py-2.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                selectedProviderFilter === 'all'
                  ? 'bg-brand-blue text-white border-brand-sky shadow-md ring-2 ring-brand-sky/20'
                  : 'bg-bg-main text-slate-400 border-accent-darkBorder hover:bg-accent-darkHover'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>View All</span>
            </button>

            {/* + ADD NEW CREDENTIAL BUTTON */}
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-brand-blue/30 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Credential</span>
            </button>
          </div>
        </div>

        {/* Credentials Cards List */}
        {filteredCredentials.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {selectedProviderFilter === 'none'
              ? 'No credentials displayed. Click "View All" or select a Cloud Provider above.'
              : 'No credentials found for this provider. Click "+ Add New Credential" to add one.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCredentials.map((cred) => (
              <div 
                key={cred.id} 
                className="p-4 bg-bg-main border border-accent-darkBorder rounded-xl space-y-2 relative group hover:border-brand-sky transition-colors"
              >
                {/* WHITE TRASH ICON APPEARS ON HOVER AT TOP-RIGHT */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCredToDelete(cred);
                  }}
                  title="Delete Credential"
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800/80 hover:bg-rose-600 text-white p-2 rounded-lg border border-slate-700 hover:border-rose-500 shadow-md"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>

                <div className="flex items-center justify-between pr-8">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-bg-card border border-accent-darkBorder text-brand-sky">
                    {cred.provider}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <CheckCircle className="w-3 h-3" /> Active
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm truncate">{cred.name}</h4>
                <p className="text-xs font-mono text-slate-400 truncate">Account / ID: {cred.account_id}</p>
                <p className="text-[11px] text-slate-500">Added: {cred.created_at}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. WORKING KUBERNETES CLUSTERS PANEL */}
      <section className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-brand-cyan" />
            Active Worker Kubernetes Clusters
          </h3>
          <p className="text-xs text-slate-400">Target Kubernetes clusters connected to your account for automated database deployment</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {clustersList.map((cls) => (
            <div key={cls.id} className="p-5 bg-bg-main border border-accent-darkBorder rounded-2xl space-y-3 shadow-md hover:border-brand-sky transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-blue/20 text-brand-sky border border-brand-sky/30">
                  {cls.provider}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  ● Running
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-white text-base">{cls.name}</h4>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Globe className="w-3.5 h-3.5 text-slate-500" /> {cls.region}
                </p>
              </div>

              <div className="pt-3 border-t border-accent-darkBorder/60 flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Nodes: <strong className="text-white">{cls.nodes_count} Worker Nodes</strong></span>
                <span className="font-mono text-[11px] text-slate-500 truncate max-w-[120px]">{cls.api_url}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MODAL FOR ADDING CREDENTIALS */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card rounded-3xl border border-accent-darkBorder w-full max-w-lg p-6 shadow-2xl space-y-6 relative text-slate-100">
            <div className="flex items-center justify-between border-b border-accent-darkBorder pb-3">
              <h4 className="font-bold text-white text-base flex items-center gap-2">
                <Key className="w-5 h-5 text-brand-sky" /> Add New Cloud Credential
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-accent-darkHover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCredential} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Credential Name</label>
                <input
                  type="text"
                  required
                  value={newCredName}
                  onChange={(e) => setNewCredName(e.target.value)}
                  placeholder="e.g., Production AWS Account"
                  className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-sky"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Select Provider</label>
                <select
                  value={newCredProvider}
                  onChange={(e) => setNewCredProvider(e.target.value as CloudProviderType)}
                  className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-sky font-semibold"
                >
                  <option value="aws">Amazon Web Services (AWS)</option>
                  <option value="azure">Microsoft Azure</option>
                  <option value="digitalocean">DigitalOcean</option>
                  <option value="gcp">Google Cloud Platform (GCP)</option>
                </select>
              </div>

              {/* AWS SPECIFIC FIELDS: 2 FIELDS */}
              {newCredProvider === 'aws' && (
                <div className="space-y-3 p-4 bg-bg-main rounded-xl border border-accent-darkBorder">
                  <span className="text-xs font-bold text-brand-sky uppercase block">AWS Security Credentials</span>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">AWS Access Key ID</label>
                    <input
                      type="text"
                      required
                      value={awsAccessKeyId}
                      onChange={(e) => setAwsAccessKeyId(e.target.value)}
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs rounded-lg px-3 py-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Secret Access Key</label>
                    <input
                      type="password"
                      required
                      value={awsSecretAccessKey}
                      onChange={(e) => setAwsSecretAccessKey(e.target.value)}
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs rounded-lg px-3 py-2 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* AZURE SPECIFIC FIELDS: 4 FIELDS */}
              {newCredProvider === 'azure' && (
                <div className="space-y-3 p-4 bg-bg-main rounded-xl border border-accent-darkBorder">
                  <span className="text-xs font-bold text-brand-sky uppercase block">Azure Active Directory (AAD) Credentials</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Tenant ID</label>
                      <input
                        type="text"
                        required
                        value={azureTenantId}
                        onChange={(e) => setAzureTenantId(e.target.value)}
                        placeholder="72f988bf-86f1-41af-91ab-..."
                        className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs rounded-lg px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Client ID</label>
                      <input
                        type="text"
                        required
                        value={azureClientId}
                        onChange={(e) => setAzureClientId(e.target.value)}
                        placeholder="e2b34a12-8921-4a1b-9f12-..."
                        className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs rounded-lg px-3 py-2 font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Client Secret</label>
                      <input
                        type="password"
                        required
                        value={azureClientSecret}
                        onChange={(e) => setAzureClientSecret(e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs rounded-lg px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Subscription ID</label>
                      <input
                        type="text"
                        required
                        value={azureSubscriptionId}
                        onChange={(e) => setAzureSubscriptionId(e.target.value)}
                        placeholder="sub_9012384910239102"
                        className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs rounded-lg px-3 py-2 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* DIGITALOCEAN SPECIFIC FIELDS: 1 FIELD */}
              {newCredProvider === 'digitalocean' && (
                <div className="space-y-3 p-4 bg-bg-main rounded-xl border border-accent-darkBorder">
                  <span className="text-xs font-bold text-brand-sky uppercase block">DigitalOcean API Token</span>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Personal Access Token</label>
                    <input
                      type="password"
                      required
                      value={doPersonalAccessToken}
                      onChange={(e) => setDoPersonalAccessToken(e.target.value)}
                      placeholder="dop_v1_819238910291029381023910239"
                      className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs rounded-lg px-3 py-2 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* GCP SPECIFIC FIELDS: FILE UPLOAD OR PASTE CONTENT */}
              {newCredProvider === 'gcp' && (
                <div className="space-y-3 p-4 bg-bg-main rounded-xl border border-accent-darkBorder">
                  <span className="text-xs font-bold text-brand-sky uppercase block">GCP Service Account Key JSON (.json File)</span>
                  
                  {/* File Upload Trigger Area */}
                  <label className="border-2 border-dashed border-accent-darkBorder hover:border-brand-sky rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-bg-card transition-colors">
                    <Upload className="w-6 h-6 text-brand-sky mb-2" />
                    <span className="text-xs font-semibold text-white">
                      {uploadedFileName ? `Loaded: ${uploadedFileName}` : 'Click to Upload Service Account JSON File'}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">Or drag and drop .json file here</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1 flex items-center justify-between">
                      <span>Or Paste JSON Content Directly:</span>
                      {gcpKeyJson && <span className="text-emerald-400 font-normal">✔ JSON Content Loaded</span>}
                    </label>
                    <textarea
                      rows={4}
                      value={gcpKeyJson}
                      onChange={(e) => setGcpKeyJson(e.target.value)}
                      placeholder='{ "type": "service_account", "project_id": "gcp-db-idp", "private_key_id": "..." }'
                      className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs rounded-lg p-3 font-mono leading-relaxed"
                    ></textarea>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-accent-darkBorder">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-accent-darkHover rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue/90 rounded-xl shadow-lg shadow-brand-blue/30"
                >
                  Save Credential
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR DELETING CREDENTIAL */}
      {credToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card rounded-3xl border border-rose-500/30 w-full max-w-md p-6 shadow-2xl space-y-5 text-slate-100">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 flex items-center justify-center border border-rose-500/30">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Delete Credential</h4>
                <p className="text-xs text-slate-400">Confirm permanent deletion of cloud key</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-bg-main p-4 rounded-xl border border-accent-darkBorder">
              Are you sure you want to permanently delete credential <strong className="text-white">{credToDelete.name}</strong> ({credToDelete.provider.toUpperCase()})?
              This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCredToDelete(null)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-accent-darkHover rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCredential}
                className="px-6 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-lg shadow-rose-600/30"
              >
                Delete Credential
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
