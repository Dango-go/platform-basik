import React, { useState } from 'react';
import { LoginPage } from './components/pages/LoginPage';
import { MainLayout } from './components/layout/MainLayout';
import { DatabasesCatalogPage } from './components/pages/DatabasesCatalogPage';
import { CreateDatabaseWizardPage } from './components/pages/CreateDatabaseWizardPage';
import { StoreAndBackupsPage } from './components/pages/StoreAndBackupsPage';
import { FinancePage } from './components/pages/FinancePage';
import { MonitoringPage } from './components/pages/MonitoringPage';
import { CloudPage } from './components/pages/CloudPage';
import { QuotasPage } from './components/pages/QuotasPage';
import { NotificationsPage } from './components/pages/NotificationsPage';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('databases');
  const [preselectedEngine, setPreselectedEngine] = useState<string>('postgresql');
  const [customHeaderTitle, setCustomHeaderTitle] = useState<string | null>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCustomHeaderTitle(null);
  };

  const handleNavigateCreate = (engineType?: string) => {
    if (engineType) {
      setPreselectedEngine(engineType);
    }
    handleTabChange('create');
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <MainLayout
      activeTab={activeTab}
      setActiveTab={handleTabChange}
      customTitle={customHeaderTitle}
      onLogout={() => setIsAuthenticated(false)}
    >
      {activeTab === 'create' && (
        <CreateDatabaseWizardPage
          initialEngineType={preselectedEngine}
          onSuccess={() => handleTabChange('databases')}
        />
      )}

      {activeTab === 'databases' && (
        <DatabasesCatalogPage
          onNavigateCreate={handleNavigateCreate}
          onTitleChange={(title) => setCustomHeaderTitle(title)}
        />
      )}

      {activeTab === 'store_backups' && <StoreAndBackupsPage />}

      {activeTab === 'quotas' && <QuotasPage />}

      {activeTab === 'notifications' && <NotificationsPage />}

      {activeTab === 'finance' && <FinancePage />}

      {activeTab === 'monitoring' && <MonitoringPage />}

      {activeTab === 'cloud' && <CloudPage />}
    </MainLayout>
  );
};
