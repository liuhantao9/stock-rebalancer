import React, { useState } from 'react';
import { useUserStorage } from '../hooks/useUserStorage';
import { SavedPortfolio } from '../types';

interface PortfolioManagerProps {
  onPortfolioLoad?: (portfolio: SavedPortfolio) => void;
  onClose?: () => void;
}

export const PortfolioManager: React.FC<PortfolioManagerProps> = ({
  onPortfolioLoad,
  onClose
}) => {
  const {
    currentPortfolio,
    portfolios,
    deletePortfolio,
    duplicatePortfolio,
    loadPortfolio,
    exportData,
    importData,
    clearUserData,
    storageStats,
    loading,
    error
  } = useUserStorage();

  const [showImportExport, setShowImportExport] = useState(false);
  const [importText, setImportText] = useState('');
  const [selectedTab, setSelectedTab] = useState<'portfolios' | 'settings'>('portfolios');

  const handleLoadPortfolio = async (portfolio: SavedPortfolio) => {
    try {
      await loadPortfolio(portfolio.id);
      onPortfolioLoad?.(portfolio);
      onClose?.();
    } catch (err) {
      console.error('Failed to load portfolio:', err);
    }
  };

  const handleDuplicatePortfolio = async (portfolioId: string, originalName: string) => {
    const newName = prompt('Enter name for duplicated portfolio:', `${originalName} (Copy)`);
    if (!newName) return;
    
    try {
      await duplicatePortfolio(portfolioId, newName);
    } catch (err) {
      console.error('Failed to duplicate portfolio:', err);
    }
  };

  const handleDeletePortfolio = async (portfolioId: string, portfolioName: string) => {
    if (window.confirm(`Are you sure you want to delete "${portfolioName}"? This action cannot be undone.`)) {
      try {
        await deletePortfolio(portfolioId);
      } catch (err) {
        console.error('Failed to delete portfolio:', err);
      }
    }
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-rebalancer-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    
    try {
      await importData(importText);
      setImportText('');
      setShowImportExport(false);
      alert('Data imported successfully!');
    } catch (err) {
      alert(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete ALL data? This will permanently remove all portfolios. This action cannot be undone.')) {
      try {
        await clearUserData();
        alert('All data cleared successfully!');
      } catch (err) {
        console.error('Failed to clear data:', err);
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Portfolio Manager</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {(['portfolios', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  selectedTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Portfolios Tab */}
          {selectedTab === 'portfolios' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Saved Portfolios</h3>
                <span className="text-sm text-gray-500">
                  {portfolios.length} portfolio{portfolios.length !== 1 ? 's' : ''}
                </span>
              </div>

              {portfolios.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No saved portfolios yet.</p>
                  <p className="text-sm">Create your first portfolio by saving your current configuration.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {portfolios.map((portfolio) => (
                    <div
                      key={portfolio.id}
                      className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${
                        currentPortfolio?.id === portfolio.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{portfolio.name}</h4>
                          {portfolio.description && (
                            <p className="text-sm text-gray-600 mt-1">{portfolio.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>{portfolio.portfolioData.stocks.length} stocks</span>
                            <span>Updated {formatDate(portfolio.updatedAt)}</span>
                            {portfolio.tags && portfolio.tags.length > 0 && (
                              <div className="flex space-x-1">
                                {portfolio.tags.map((tag, index) => (
                                  <span key={index} className="bg-gray-100 px-2 py-1 rounded text-xs">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleLoadPortfolio(portfolio)}
                            className="btn-primary text-xs px-3 py-1"
                            disabled={loading}
                          >
                            Load
                          </button>
                          <button
                            onClick={() => handleDuplicatePortfolio(portfolio.id, portfolio.name)}
                            className="btn-secondary text-xs px-3 py-1"
                            disabled={loading}
                          >
                            Duplicate
                          </button>
                          <button
                            onClick={() => handleDeletePortfolio(portfolio.id, portfolio.name)}
                            className="btn-danger text-xs px-3 py-1"
                            disabled={loading}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {/* Settings Tab */}
          {selectedTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Storage Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{storageStats.portfolioCount}</div>
                    <div className="text-sm text-green-800">Portfolios</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{formatFileSize(storageStats.storageSize)}</div>
                    <div className="text-sm text-purple-800">Storage Used</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-bold text-gray-600">
                      {storageStats.lastUpdated ? formatDate(storageStats.lastUpdated) : 'Never'}
                    </div>
                    <div className="text-sm text-gray-800">Last Updated</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Import/Export</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleExport}
                    className="btn-primary w-full"
                    disabled={loading}
                  >
                    Export All Data
                  </button>
                  
                  <button
                    onClick={() => setShowImportExport(!showImportExport)}
                    className="btn-secondary w-full"
                  >
                    Import Data
                  </button>

                  {showImportExport && (
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <textarea
                        className="form-input w-full h-32"
                        placeholder="Paste exported JSON data here..."
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                      />
                      <div className="flex space-x-2 mt-3">
                        <button
                          onClick={handleImport}
                          className="btn-primary text-sm"
                          disabled={loading || !importText.trim()}
                        >
                          Import
                        </button>
                        <button
                          onClick={() => setShowImportExport(false)}
                          className="btn-secondary text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 text-red-600">Danger Zone</h3>
                <button
                  onClick={handleClearAll}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md w-full"
                  disabled={loading}
                >
                  Clear All Data
                </button>
                <p className="text-sm text-red-600 mt-2">
                  This will permanently delete all portfolios. This action cannot be undone.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="loading-spinner w-8 h-8"></div>
          </div>
        )}
      </div>
    </div>
  );
};