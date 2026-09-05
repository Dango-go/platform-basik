import React, { useState, useEffect } from 'react';
import { CLOUD_CREDENTIALS, K8S_CLUSTERS } from '../../services/mockData';
import { CloudCredential, K8sCluster, CloudProviderType } from '../../types';
import { apiClient } from '../../services/apiClient';
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
  AlertTriangle,
  RefreshCw,
  Search
} from 'lucide-react';

export const CloudPage: React.FC = () => {
  const [credentialsList, setCredentialsList] = useState<CloudCredential[]>(CLOUD_CREDENTIALS);
  const [clustersList, setClustersList] = useState<K8sCluster[]>(K8S_CLUSTERS);

  // Search creds name state
  const [searchCredQuery, setSearchCredQuery] = useState<string>('');

  // Selected Credentials Provider filter: 'all' | 'none' | CloudProviderType
  const [selectedProviderFilter, setSelectedProviderFilter] = useState<CloudProviderType | 'all' | 'none'>('all');

  // Selected Cluster Provider filter: 'all' | 'aws' | 'gcp' | 'azure' | 'digitalocean' | 'onprem'
  const [selectedClusterProviderFilter, setSelectedClusterProviderFilter] = useState<string>('all');

  // Sync / Update state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load existing credentials & clusters on mount
  useEffect(() => {
    apiClient.getCredentials().then((creds) => {
      if (creds && creds.length > 0) {
        setCredentialsList(creds);
      }
    }).catch(() => {});

    apiClient.getUserClusters(1).then((fetched) => {
      if (fetched.length > 0) {
        setClustersList((prev) => {
          const merged = [...fetched];
          prev.forEach((p) => {
            if (!merged.some((m) => m.name === p.name)) {
              merged.push(p);
            }
          });
          return merged;
        });
      }
    }).catch(() => {});
  }, []);

  // Modal State for adding new credentials
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCredName, setNewCredName] = useState('');
  const [newCredProvider, setNewCredProvider] = useState<CloudProviderType>('aws');
  const [isSubmittingCred, setIsSubmittingCred] = useState(false);
  const [credSubmitError, setCredSubmitError] = useState<string | null>(null);

  // Provider-specific input fields
  const [awsAccessKeyId, setAwsAccessKeyId] = useState('');
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState('');

  const [azureTenantId, setAzureTenantId] = useState('');
  const [azureClientId, setAzureClientId] = useState('');
  const [azureClientSecret, setAzureClientSecret] = useState('');
  const [azureSubscriptionId, setAzureSubscriptionId] = useState('');

  const [doPersonalAccessToken, setDoPersonalAccessToken] = useState('');
  const [gcpKeyJson, setGcpKeyJson] = useState('');
  const [gcpInputMode, setGcpInputMode] = useState<'file' | 'text'>('file');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Deletion Modal State
  const [credToDelete, setCredToDelete] = useState<CloudCredential | null>(null);

  // Discovery / Sync Modal State
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [selectedCredAliasForSync, setSelectedCredAliasForSync] = useState<string>('all');
  const [selectedRegionForSync, setSelectedRegionForSync] = useState<string>('');

  // Sync Clusters click handler - opens modal or shows error if no credentials
  const handleOpenSyncModal = () => {
    setSyncStatusMsg(null);
    if (credentialsList.length === 0) {
      setSyncStatusMsg({
        type: 'error',
        text: 'No cloud credentials found on platform. Please add a cloud credential first.'
      });
      return;
    }
    const active = credentialsList.filter((c) => c.status === 'active');
    if (active.length > 0) {
      setSelectedCredAliasForSync(active[0].name || active[0].id);
    } else {
      setSelectedCredAliasForSync('all');
    }
    setSelectedRegionForSync('');
    setShowSyncModal(true);
  };

  // Executes discovery for selected credential alias or all credentials
  const executeDiscoveryScan = async () => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    setShowSyncModal(false);

    try {
      let activeCreds = credentialsList.filter((c) => c.status === 'active');
      if (activeCreds.length === 0) {
        activeCreds = credentialsList; // fallback to all
      }

      let credsToScan = activeCreds;
      if (selectedCredAliasForSync !== 'all') {
        credsToScan = activeCreds.filter(
          (c) => (c.name || c.id) === selectedCredAliasForSync
        );
        if (credsToScan.length === 0) {
          credsToScan = activeCreds;
        }
      }

      let newlyDiscovered: K8sCluster[] = [];
      let scanErrors: string[] = [];

      for (const cred of credsToScan) {
        try {
          const discovered = await apiClient.discoverClusters(
            cred.provider,
            cred.name || cred.id,
            selectedRegionForSync || undefined,
            1
          );
          if (discovered.length > 0) {
            newlyDiscovered = [...newlyDiscovered, ...discovered];
          }
        } catch (err: any) {
          console.warn(`Discovery failed for ${cred.name}:`, err);
          scanErrors.push(`${cred.name}: ${err.message || 'Scan failed'}`);
        }
      }

      if (newlyDiscovered.length > 0) {
        setClustersList((prev) => {
          const combined = [...newlyDiscovered];
          prev.forEach((existing) => {
            if (!combined.some((c) => c.name === existing.name)) {
              combined.push(existing);
            }
          });
          return combined;
        });
        setSyncStatusMsg({
          type: 'success',
          text: `Successfully discovered ${newlyDiscovered.length} Kubernetes cluster(s)!`
        });
      } else if (scanErrors.length > 0) {
        setSyncStatusMsg({
          type: 'error',
          text: `Discovery Error: ${scanErrors.join('; ')}`
        });
      } else {
        setSyncStatusMsg({
          type: 'success',
          text: 'Scan completed. No new clusters found for selected credential.'
        });
      }
    } catch (err: any) {
      setSyncStatusMsg({
        type: 'error',
        text: err.message || 'Failed to scan clusters from discovery-service.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

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

  const handleAddCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCredName) return;

    setIsSubmittingCred(true);
    setCredSubmitError(null);

    let credsPayload: Record<string, any> = {};
    if (newCredProvider === 'gcp') {
      try {
        credsPayload = JSON.parse(gcpKeyJson);
      } catch (err) {
        setCredSubmitError('Invalid JSON format for GCP Service Account key.');
        setIsSubmittingCred(false);
        return;
      }
    } else if (newCredProvider === 'aws') {
      credsPayload = {
        aws_access_key_id: awsAccessKeyId,
        aws_secret_access_key: awsSecretAccessKey
      };
    } else if (newCredProvider === 'azure') {
      credsPayload = {
        tenant_id: azureTenantId,
        client_id: azureClientId,
        client_secret: azureClientSecret,
        subscription_id: azureSubscriptionId
      };
    } else if (newCredProvider === 'digitalocean') {
      credsPayload = {
        token: doPersonalAccessToken
      };
    }

    try {
      // Send credentials payload to provider-service for validation and encrypted storage in vault-service
      await apiClient.saveCloudCredentials({
        user_id: 1,
        provider_type: newCredProvider,
        alias: newCredName,
        credentials: credsPayload
      });

      const newCred: CloudCredential = {
        id: `cred-${Date.now()}`,
        name: newCredName,
        provider: newCredProvider,
        account_id: `acc_${Math.floor(100000 + Math.random() * 900000)}`,
        created_at: new Date().toISOString().split('T')[0],
        status: 'active'
      };

      setCredentialsList([newCred, ...credentialsList]);
      setShowAddModal(false);
      resetFormFields();
    } catch (err: any) {
      setCredSubmitError(err.message || 'Validation failed. Check your cloud credentials and try again.');
    } finally {
      setIsSubmittingCred(false);
    }
  };

  const confirmDeleteCredential = () => {
    if (credToDelete) {
      setCredentialsList(credentialsList.filter((c) => c.id !== credToDelete.id));
      setCredToDelete(null);
    }
  };

  const resetFormFields = () => {
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
  };

  const toggleViewAll = () => {
    if (selectedProviderFilter === 'all') {
      setSelectedProviderFilter('none');
    } else {
      setSelectedProviderFilter('all');
    }
  };

  // 4 Square Cards config for Cloud Credentials
  const providersConfig = [
    {
      id: 'aws' as CloudProviderType,
      name: 'Amazon Web Services',
      icon: 'https://www.vectorlogo.zone/logos/amazon_aws/amazon_aws-icon.svg',
      count: credentialsList.filter((c) => c.provider === 'aws').length
    },
    {
      id: 'azure' as CloudProviderType,
      name: 'Microsoft Azure',
      icon: 'https://www.vectorlogo.zone/logos/microsoft_azure/microsoft_azure-icon.svg',
      count: credentialsList.filter((c) => c.provider === 'azure').length
    },
    {
      id: 'digitalocean' as CloudProviderType,
      name: 'DigitalOcean',
      icon: 'https://www.vectorlogo.zone/logos/digitalocean/digitalocean-icon.svg',
      count: credentialsList.filter((c) => c.provider === 'digitalocean').length
    },
    {
      id: 'gcp' as CloudProviderType,
      name: 'Google Cloud Platform',
      icon: 'https://www.vectorlogo.zone/logos/google_cloud/google_cloud-icon.svg',
      count: credentialsList.filter((c) => c.provider === 'gcp').length
    }
  ];

  // Filtered credentials list based on selectedProviderFilter and search query
  const filteredCredentials = credentialsList.filter((c) => {
    const matchesProvider = selectedProviderFilter === 'all'
      ? true
      : selectedProviderFilter === 'none'
      ? false
      : c.provider === selectedProviderFilter;

    const matchesSearch = searchCredQuery === '' ||
                          c.name.toLowerCase().includes(searchCredQuery.toLowerCase()) ||
                          c.provider.toLowerCase().includes(searchCredQuery.toLowerCase());

    return matchesProvider && matchesSearch;
  });

  // Filtered K8s clusters list based on selectedClusterProviderFilter
  const filteredClusters = selectedClusterProviderFilter === 'all'
    ? clustersList
    : clustersList.filter((cls) => {
        const prov = cls.provider.toLowerCase();
        if (selectedClusterProviderFilter === 'aws') return prov.includes('aws') || prov.includes('eks');
        if (selectedClusterProviderFilter === 'gcp') return prov.includes('gcp') || prov.includes('gke');
        if (selectedClusterProviderFilter === 'azure') return prov.includes('azure') || prov.includes('aks');
        if (selectedClusterProviderFilter === 'digitalocean') return prov.includes('digitalocean') || prov.includes('doks');
        if (selectedClusterProviderFilter === 'onprem') return prov.includes('on-premise') || prov.includes('lenovo');
        return true;
      });

  return (
    <div className="space-y-8 text-slate-100">
      
      {/* 1. CLOUD PROVIDERS IN SQUARE CARDS WITH VECTOR LOGOS */}
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Cloud className="w-5 h-5 text-brand-sky" />
            Cloud Credentials
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
            {/* SEARCH INPUT BY CREDS NAME */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search creds..."
                value={searchCredQuery}
                onChange={(e) => setSearchCredQuery(e.target.value)}
                className="bg-bg-main border border-accent-darkBorder rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-brand-sky transition-all w-36 sm:w-44"
              />
            </div>

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
                <p className="text-[11px] text-slate-500">Added: {cred.created_at}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. WORKING KUBERNETES CLUSTERS PANEL WITH INTERACTIVE PROVIDER FILTERS & UPDATE BUTTON */}
      <section className="bg-bg-card border border-accent-darkBorder rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-accent-darkBorder pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-brand-cyan" />
              Kubernetes Clusters
            </h3>
            <p className="text-xs text-slate-400">Target Kubernetes clusters connected to your account for automated database deployment</p>
          </div>

          <div className="flex items-center gap-3">
            {/* TOGGLE ALL CLUSTERS BUTTON */}
            <button
              onClick={() => setSelectedClusterProviderFilter('all')}
              className={`text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all flex items-center gap-1.5 ${
                selectedClusterProviderFilter === 'all'
                  ? 'bg-brand-blue text-white border-brand-sky shadow-md ring-2 ring-brand-sky/20'
                  : 'bg-bg-main text-slate-400 border-accent-darkBorder hover:bg-accent-darkHover'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>All Clusters</span>
            </button>

            {/* UPDATE / REFRESH BUTTON */}
            <button
              onClick={handleOpenSyncModal}
              disabled={isSyncing}
              title="Scan & Sync Kubernetes Clusters from Cloud Providers"
              className="bg-bg-main hover:bg-brand-blue/20 text-brand-sky hover:text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-accent-darkBorder hover:border-brand-sky shadow-md flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-brand-sky ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Update'}</span>
            </button>
          </div>
        </div>

        {/* SYNC STATUS NOTIFICATION BANNER */}
        {syncStatusMsg && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
            syncStatusMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            <span>{syncStatusMsg.text}</span>
            <button onClick={() => setSyncStatusMsg(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* PROVIDER FILTER BADGES BAR FOR CLUSTERS */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: 'all', label: 'All Clusters', icon: '' },
            { id: 'aws', label: 'Amazon Web Services (AWS)', icon: 'https://www.vectorlogo.zone/logos/amazon_aws/amazon_aws-icon.svg' },
            { id: 'gcp', label: 'Google Cloud Platform (GCP)', icon: 'https://www.vectorlogo.zone/logos/google_cloud/google_cloud-icon.svg' },
            { id: 'azure', label: 'Microsoft Azure', icon: 'https://www.vectorlogo.zone/logos/microsoft_azure/microsoft_azure-icon.svg' },
            { id: 'digitalocean', label: 'DigitalOcean', icon: 'https://www.vectorlogo.zone/logos/digitalocean/digitalocean-icon.svg' },
            { id: 'onprem', label: 'On-Premise', icon: '🖥️' }
          ].map((filter) => {
            const isSelected = selectedClusterProviderFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setSelectedClusterProviderFilter(filter.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-brand-blue/20 border-brand-sky text-white ring-2 ring-brand-sky/30 shadow-md'
                    : 'bg-bg-main text-slate-400 border-accent-darkBorder hover:border-brand-sky/40 hover:text-white hover:bg-accent-darkHover'
                }`}
              >
                {filter.icon.startsWith('http') ? (
                  <img src={filter.icon} alt={filter.label} className="w-4 h-4 object-contain" />
                ) : filter.icon ? (
                  <span>{filter.icon}</span>
                ) : null}
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>

        {/* CLUSTERS GRID */}
        {filteredClusters.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No active Kubernetes clusters found for this provider. Select another provider or click "All Clusters".
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {filteredClusters.map((cls) => (
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
        )}
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

            {credSubmitError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 font-semibold flex items-center justify-between">
                <span>{credSubmitError}</span>
                <button onClick={() => setCredSubmitError(null)} className="text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

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
                      className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-sky font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">AWS Secret Access Key</label>
                    <input
                      type="password"
                      required
                      value={awsSecretAccessKey}
                      onChange={(e) => setAwsSecretAccessKey(e.target.value)}
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-sky font-mono"
                    />
                  </div>
                </div>
              )}

              {/* AZURE SPECIFIC FIELDS */}
              {newCredProvider === 'azure' && (
                <div className="space-y-3 p-4 bg-bg-main rounded-xl border border-accent-darkBorder">
                  <span className="text-xs font-bold text-brand-sky uppercase block">Azure Service Principal Credentials</span>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Tenant ID</label>
                    <input
                      type="text"
                      required
                      value={azureTenantId}
                      onChange={(e) => setAzureTenantId(e.target.value)}
                      placeholder="00000000-0000-0000-0000-000000000000"
                      className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-sky font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Client ID (App ID)</label>
                    <input
                      type="text"
                      required
                      value={azureClientId}
                      onChange={(e) => setAzureClientId(e.target.value)}
                      placeholder="00000000-0000-0000-0000-000000000000"
                      className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-sky font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Client Secret</label>
                    <input
                      type="password"
                      required
                      value={azureClientSecret}
                      onChange={(e) => setAzureClientSecret(e.target.value)}
                      placeholder="secret_key_string"
                      className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-sky font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Subscription ID</label>
                    <input
                      type="text"
                      required
                      value={azureSubscriptionId}
                      onChange={(e) => setAzureSubscriptionId(e.target.value)}
                      placeholder="00000000-0000-0000-0000-000000000000"
                      className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-sky font-mono"
                    />
                  </div>
                </div>
              )}

              {/* DIGITALOCEAN SPECIFIC FIELDS */}
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
                      placeholder="dop_v1_..."
                      className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-sky font-mono"
                    />
                  </div>
                </div>
              )}

              {/* GCP SPECIFIC FIELDS: FILE UPLOAD OR RAW TEXT */}
              {newCredProvider === 'gcp' && (
                <div className="space-y-3 p-4 bg-bg-main rounded-xl border border-accent-darkBorder">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-sky uppercase">GCP Service Account Key</span>
                    
                    {/* TAB TOGGLE: UPLOAD FILE vs PASTE TEXT */}
                    <div className="flex items-center gap-1 bg-bg-card p-1 rounded-lg border border-accent-darkBorder">
                      <button
                        type="button"
                        onClick={() => setGcpInputMode('file')}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                          gcpInputMode === 'file' 
                            ? 'bg-brand-blue text-white shadow-sm' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => setGcpInputMode('text')}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                          gcpInputMode === 'text' 
                            ? 'bg-brand-blue text-white shadow-sm' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Paste JSON
                      </button>
                    </div>
                  </div>

                  {gcpInputMode === 'file' ? (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Upload JSON Key File</label>
                      <label className="border-2 border-dashed border-accent-darkBorder hover:border-brand-sky rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-bg-card/50 transition-colors">
                        <Upload className="w-6 h-6 text-brand-sky mb-2" />
                        <span className="text-xs font-bold text-white">
                          {uploadedFileName ? uploadedFileName : 'Click to select GCP .json file'}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-1">Service Account Private Key</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Paste Service Account JSON Content</label>
                      <textarea
                        rows={5}
                        required
                        value={gcpKeyJson}
                        onChange={(e) => setGcpKeyJson(e.target.value)}
                        placeholder='{"type": "service_account", "project_id": "my-gcp-project", ...}'
                        className="w-full bg-bg-card border border-accent-darkBorder text-white text-xs font-mono rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-brand-sky"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-accent-darkBorder flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmittingCred}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCred}
                  className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-brand-blue/30 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmittingCred && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmittingCred ? 'Validating...' : 'Save Credential'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DELETION MODAL */}
      {credToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card rounded-3xl border border-rose-500/40 w-full max-w-md p-6 shadow-2xl space-y-5 relative text-slate-100">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Delete Cloud Credential</h4>
                <p className="text-xs text-slate-400">This action cannot be undone</p>
              </div>
            </div>

            <div className="p-4 bg-bg-main rounded-xl border border-accent-darkBorder space-y-1 text-xs">
              <p className="text-slate-300 font-medium">Are you sure you want to remove:</p>
              <p className="font-bold text-white text-sm">{credToDelete.name}</p>
              <p className="text-[11px] text-slate-400 uppercase">Provider: {credToDelete.provider}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCredToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCredential}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-rose-600/30 transition-all"
              >
                Delete Credential
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISCOVERY CLUSTERS MODAL WITH ALIAS SELECTOR */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-bg-card rounded-3xl border border-accent-darkBorder w-full max-w-lg p-6 shadow-2xl space-y-6 relative text-slate-100">
            <div className="flex items-center justify-between border-b border-accent-darkBorder pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-blue/20 flex items-center justify-center border border-brand-sky/30">
                  <Server className="w-5 h-5 text-brand-sky" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Scan Cloud Clusters</h3>
                  <p className="text-xs text-slate-400">Select connected credentials to discover Kubernetes clusters</p>
                </div>
              </div>
              <button
                onClick={() => setShowSyncModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-accent-darkHover transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* ALIAS SELECTOR DROPDOWN */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Select Credential (Alias)
                </label>
                <select
                  value={selectedCredAliasForSync}
                  onChange={(e) => setSelectedCredAliasForSync(e.target.value)}
                  className="w-full bg-bg-main border border-accent-darkBorder text-white text-sm font-semibold rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-sky"
                >
                  <option value="all">✨ All Connected Cloud Credentials (Scan All)</option>
                  {credentialsList.map((c) => (
                    <option key={c.id} value={c.name || c.id}>
                      [{c.provider.toUpperCase()}] {c.name} (Alias: {c.name})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Discovery-service will pull decrypted keys from Vault for this specific alias to scan Kubernetes clusters.
                </p>
              </div>

              {/* REGION INPUT (OPTIONAL) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Target Region (Optional)
                </label>
                <input
                  type="text"
                  value={selectedRegionForSync}
                  onChange={(e) => setSelectedRegionForSync(e.target.value)}
                  placeholder="e.g. us-central1, europe-west1 (Leave empty for all regions)"
                  className="w-full bg-bg-main border border-accent-darkBorder text-white text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-brand-sky"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-accent-darkBorder flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDiscoveryScan}
                disabled={isSyncing}
                className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-brand-blue/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>{isSyncing ? 'Scanning...' : 'Start Cluster Scan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
