import React, { useState } from 'react';
import { LoginPage } from './components/pages/LoginPage';
import { MainLayout } from './components/layout/MainLayout';
import { DatabasesCatalogPage } from './components/pages/DatabasesCatalogPage';
import { CreateDatabaseWizardPage } from './components/pages/CreateDatabaseWizardPage';
import { FinancePage } from './components/pages/FinancePage';
import { MonitoringPage } from './components/pages/MonitoringPage';
import { CloudPage } from './components/pages/CloudPage';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('databases');
  const [preselectedEngine, setPreselectedEngine] = useState<string>('postgresql');

  const handleNavigateCreate = (engineType?: string) => {
    if (engineType) {
      setPreselectedEngine(engineType);
    }
    setActiveTab('create');
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <MainLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={() => setIsAuthenticated(false)}
    >
      {activeTab === 'create' && (
        <CreateDatabaseWizardPage
          initialEngineType={preselectedEngine}
          onSuccess={() => setActiveTab('databases')}
        />
      )}

      {activeTab === 'databases' && (
        <DatabasesCatalogPage onNavigateCreate={handleNavigateCreate} />
      )}

      {activeTab === 'finance' && <FinancePage />}

      {activeTab === 'monitoring' && <MonitoringPage />}

      {activeTab === 'cloud' && <CloudPage />}
    </MainLayout>
  );
};
