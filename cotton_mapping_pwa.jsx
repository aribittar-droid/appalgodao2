import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Save, Download, Upload, Trash2, RotateCcw, Grid, 
         Calculator, Camera, MapPin, Layers, TrendingUp, Eye, 
         Info, Book, Settings, ChevronDown, ChevronUp, FileText, 
         Smartphone, Wifi, WifiOff } from 'lucide-react';

// PWA Setup - Configure meta tags and manifest
const setupPWA = () => {
  if (typeof document === 'undefined') return;

  // Viewport meta
  let viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    document.head.appendChild(viewport);
  }

  // Theme color
  let themeColor = document.querySelector('meta[name="theme-color"]');
  if (!themeColor) {
    themeColor = document.createElement('meta');
    themeColor.name = 'theme-color';
    themeColor.content = '#059669';
    document.head.appendChild(themeColor);
  }

  // Apple specific meta tags
  let appleMobile = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
  if (!appleMobile) {
    appleMobile = document.createElement('meta');
    appleMobile.name = 'apple-mobile-web-app-capable';
    appleMobile.content = 'yes';
    document.head.appendChild(appleMobile);
  }

  let appleStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (!appleStatus) {
    appleStatus = document.createElement('meta');
    appleStatus.name = 'apple-mobile-web-app-status-bar-style';
    appleStatus.content = 'black-translucent';
    document.head.appendChild(appleStatus);
  }

  let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (!appleTitle) {
    appleTitle = document.createElement('meta');
    appleTitle.name = 'apple-mobile-web-app-title';
    appleTitle.content = 'Algodão Map';
    document.head.appendChild(appleTitle);
  }

  // Manifest link
  let manifestLink = document.querySelector('link[rel="manifest"]');
  if (!manifestLink) {
    manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = '/manifest.json';
    document.head.appendChild(manifestLink);
  }
};

const CottonMappingSystem = () => {
  // Estado principal do mapeamento
  const [mappingData, setMappingData] = useState({
    plantHeight: 118,
    vegetativeNodes: 6,
    gridData: Array(20).fill(null).map(() => Array(6).fill({ 
      type: '', 
      position: null, 
      status: '', 
      notes: '' 
    })),
    metadata: {
      variety: '',
      field: '',
      date: new Date().toISOString().split('T')[0],
      evaluator: '',
      dae: 95,
      plot: '',
      temperature: '',
      humidity: ''
    }
  });

  const [activeTab, setActiveTab] = useState('mapping');
  const [selectedCell, setSelectedCell] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [modalPosition, setModalPosition] = useState({ row: 0, col: 0 });
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const fileInputRef = useRef(null);

  // PWA Installation Setup
  useEffect(() => {
    setupPWA();

    // Check if app is installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          window.navigator.standalone || 
          document.referrer.includes('android-app://')) {
        setIsInstalled(true);
      }
    };

    checkInstalled();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      console.log('PWA install prompt ready');
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      console.log('PWA installed successfully!');
    };

    // Network status listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(registration => {
          console.log('Service Worker registered:', registration.scope);
        })
        .catch(error => {
          console.log('Service Worker registration failed:', error);
        });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save data to localStorage for offline persistence
  useEffect(() => {
    localStorage.setItem('cotton_mapping_data', JSON.stringify(mappingData));
  }, [mappingData]);

  // Load saved data on startup
  useEffect(() => {
    const savedData = localStorage.getItem('cotton_mapping_data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setMappingData(parsedData);
      } catch (error) {
        console.log('Error loading saved data:', error);
      }
    }
  }, []);

  // Install PWA function
  const handleInstallApp = async () => {
    if (!installPrompt) return;

    try {
      const result = await installPrompt.prompt();
      console.log('Install result:', result.outcome);
      
      if (result.outcome === 'accepted') {
        setInstallPrompt(null);
      }
    } catch (error) {
      console.log('Install error:', error);
    }
  };

  // Tipos de estruturas reprodutivas
  const structures = [
    { id: 'B', name: 'Botão Floral', color: 'bg-green-500', symbol: 'B' },
    { id: 'F', name: 'Flor', color: 'bg-yellow-500', symbol: 'F' },
    { id: 'M', name: 'Maçã', color: 'bg-orange-500', symbol: 'M' },
    { id: 'C', name: 'Capulho', color: 'bg-blue-500', symbol: 'C' },
    { id: 'A', name: 'Aborto', color: 'bg-red-500', symbol: 'A' }
  ];

  // Função para lidar com clique na célula da grade
  const handleCellClick = useCallback((row, col) => {
    setModalPosition({ row, col });
    setShowStructureModal(true);
  }, []);

  // Função para selecionar estrutura no modal
  const selectStructure = useCallback((structureType) => {
    const { row, col } = modalPosition;
    const newGridData = [...mappingData.gridData];
    
    if (structureType === '') {
      newGridData[row][col] = { type: '', position: null, status: '', notes: '' };
    } else {
      newGridData[row][col] = {
        type: structureType,
        position: `${row + 1}-${col + 1}`,
        status: 'active',
        notes: newGridData[row][col].notes || ''
      };
    }
    
    setMappingData(prev => ({ ...prev, gridData: newGridData }));
    setShowStructureModal(false);
  }, [modalPosition, mappingData.gridData]);

  // Análise automática dos dados de mapeamento
  const analyzeMapping = useCallback(() => {
    const counts = structures.reduce((acc, struct) => ({ ...acc, [struct.id]: 0 }), {});
    let totalPositions = 0;
    const positionDetails = [];

    mappingData.gridData.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell.type) {
          counts[cell.type]++;
          totalPositions++;
          positionDetails.push({
            row: rowIndex + 1,
            col: colIndex + 1,
            type: cell.type,
            position: `${rowIndex + 1}-${colIndex + 1}`
          });
        }
      });
    });

    const percentages = Object.keys(counts).reduce((acc, key) => ({
      ...acc,
      [key]: totalPositions > 0 ? ((counts[key] / totalPositions) * 100).toFixed(2) : '0.00'
    }), {});

    const abortsByPosition = {};
    for (let i = 1; i <= 4; i++) {
      abortsByPosition[i] = positionDetails.filter(p => 
        p.col === i && p.type === 'A'
      ).length;
    }

    const retention = totalPositions > 0 ? 
      (((counts.B + counts.F + counts.M + counts.C) / totalPositions) * 100).toFixed(2) : '0.00';

    const results = {
      counts,
      percentages,
      totalPositions,
      retention,
      abortsByPosition,
      positionDetails
    };

    setAnalysisResults(results);
    
    // Save analysis to localStorage
    localStorage.setItem('cotton_analysis_results', JSON.stringify(results));
  }, [mappingData.gridData]);

  // Exportar dados para PDF
  const exportToPDF = useCallback(async () => {
    if (!analysisResults) {
      alert('Execute a análise primeiro para gerar o relatório PDF.');
      return;
    }

    try {
      const { jsPDF } = await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPosition = 20;

      const addLineBreak = (height = 8) => {
        yPosition += height;
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
      };

      const addText = (text, x, fontSize = 10, fontStyle = 'normal') => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', fontStyle);
        const lines = pdf.splitTextToSize(text, pageWidth - 40);
        pdf.text(lines, x, yPosition);
        yPosition += lines.length * (fontSize * 0.8);
      };

      // Header
      pdf.setFillColor(5, 150, 105);
      pdf.rect(0, 0, pageWidth, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      addText('RELATÓRIO DE MAPEAMENTO DO ALGODOEIRO', 20, 16, 'bold');
      
      yPosition = 35;
      pdf.setTextColor(0, 0, 0);

      // Metadata
      addText('DADOS DO EXPERIMENTO', 20, 14, 'bold');
      addLineBreak(5);
      
      addText(`Variedade: ${mappingData.metadata.variety || 'Não informado'}`, 20, 10);
      addText(`Talhão/Parcela: ${mappingData.metadata.field || 'Não informado'}`, 20, 10);
      addText(`Data da Avaliação: ${mappingData.metadata.date}`, 20, 10);
      addText(`Avaliador: ${mappingData.metadata.evaluator || 'Não informado'}`, 20, 10);
      addText(`DAE: ${mappingData.metadata.dae} dias`, 20, 10);
      addText(`Altura da Planta: ${mappingData.plantHeight} cm`, 20, 10);
      addText(`Nós Vegetativos: ${mappingData.vegetativeNodes}`, 20, 10);
      
      addLineBreak(10);

      // Summary
      addText('RESUMO QUANTITATIVO', 20, 14, 'bold');
      addLineBreak(5);

      structures.forEach(struct => {
        addText(`${struct.name}: ${analysisResults.counts[struct.id]} (${analysisResults.percentages[struct.id]}%)`, 20, 10);
      });

      addLineBreak(5);
      addText(`Total de Posições: ${analysisResults.totalPositions}`, 20, 12, 'bold');
      addText(`Taxa de Retenção: ${analysisResults.retention}%`, 20, 12, 'bold');
      addText(`Taxa de Aborto: ${analysisResults.percentages.A}%`, 20, 12, 'bold');

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text('Sistema de Mapeamento do Algodão - ' + new Date().toLocaleString('pt-BR'), 20, 285);

      const fileName = `Relatorio_Mapeamento_Algodao_${mappingData.metadata.field || 'Campo'}_${mappingData.metadata.date}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar PDF. Verifique sua conexão com a internet.');
    }
  }, [mappingData, analysisResults]);

  // Exportar dados para JSON
  const exportData = useCallback(() => {
    const dataToExport = {
      ...mappingData,
      analysis: analysisResults,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mapeamento_algodao_${mappingData.metadata.field}_${mappingData.metadata.date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [mappingData, analysisResults]);

  // Importar dados
  const importData = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (importedData.gridData && importedData.metadata) {
          setMappingData(importedData);
          if (importedData.analysis) {
            setAnalysisResults(importedData.analysis);
          }
        } else {
          alert('Arquivo inválido.');
        }
      } catch (error) {
        alert('Erro ao importar: ' + error.message);
      }
    };
    reader.readAsText(file);
  }, []);

  // Limpar grade
  const clearGrid = useCallback(() => {
    if (window.confirm('Limpar todos os dados?')) {
      setMappingData(prev => ({
        ...prev,
        gridData: Array(20).fill(null).map(() => Array(6).fill({ 
          type: '', 
          position: null, 
          status: '', 
          notes: '' 
        }))
      }));
      setAnalysisResults(null);
    }
  }, []);

  useEffect(() => {
    if (Object.values(mappingData.gridData.flat().filter(cell => cell.type)).length > 0) {
      analyzeMapping();
    }
  }, [mappingData.gridData, analyzeMapping]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Grid className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Sistema de Mapeamento do Algodão
                </h1>
                <p className="text-green-100 text-lg mt-1">
                  Quantificação de Estruturas Reprodutivas - Metodologia IMAmt
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Online/Offline Status */}
              <div className={`px-3 py-1 rounded-lg backdrop-blur-sm flex items-center space-x-2 ${
                isOnline ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}>
                {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
              
              {/* Install Button */}
              {installPrompt && !isInstalled && (
                <button
                  onClick={handleInstallApp}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm flex items-center space-x-2"
                  title="Instalar app no iOS/Android"
                >
                  <Smartphone className="h-4 w-4" />
                  <span className="hidden sm:inline">Instalar</span>
                </button>
              )}
              
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm"
              >
                <Info className="h-5 w-5 inline mr-2" />
                Instruções
              </button>
              <div className="bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                <span className="text-sm">DAE: {mappingData.metadata.dae} dias</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Install Instructions for iOS */}
      {!isInstalled && navigator.userAgent.includes('iPhone') && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 m-4">
          <div className="flex">
            <Smartphone className="h-6 w-6 text-blue-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                Instalar no iPhone/iPad
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Toque em <strong>Compartilhar</strong> → <strong>Adicionar à Tela de Início</strong> para usar como app nativo
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {showInstructions && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 m-4 rounded-r-lg">
          <div className="flex">
            <Book className="h-6 w-6 text-blue-400 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-blue-800">
                Metodologia de Mapeamento - IMAmt
              </h3>
              <div className="mt-2 text-blue-700 space-y-2">
                <p><strong>Como usar:</strong> Clique em uma posição e selecione o tipo de estrutura</p>
                <p><strong>Notação:</strong> Ramo frutífero (linha) x Posição no ramo (coluna)</p>
                <p><strong>Funciona offline:</strong> Seus dados ficam salvos no dispositivo</p>
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {structures.map(struct => (
                    <div key={struct.id} className="flex items-center space-x-2">
                      <div className={`w-4 h-4 ${struct.color} rounded`}></div>
                      <span className="text-sm">{struct.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'mapping', name: 'Mapeamento', icon: Grid },
                { id: 'metadata', name: 'Dados da Planta', icon: Settings },
                { id: 'analysis', name: 'Análise', icon: TrendingUp }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5 inline mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Metadata Tab */}
        {activeTab === 'metadata' && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <Settings className="h-6 w-6 mr-3 text-green-600" />
              Dados da Planta e Experimento
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries({
                variety: 'Variedade',
                field: 'Talhão/Parcela',
                date: 'Data da Avaliação',
                evaluator: 'Avaliador',
                dae: 'DAE (Dias Após Emergência)',
                plot: 'Planta/Plot',
                temperature: 'Temperatura (°C)',
                humidity: 'Umidade (%)'
              }).map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {label}
                  </label>
                  <input
                    type={key === 'date' ? 'date' : (key === 'dae' || key === 'temperature' || key === 'humidity') ? 'number' : 'text'}
                    value={mappingData.metadata[key] || ''}
                    onChange={(e) => setMappingData(prev => ({
                      ...prev,
                      metadata: {
                        ...prev.metadata,
                        [key]: e.target.value
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder={`Inserir ${label.toLowerCase()}`}
                  />
                </div>
              ))}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Altura da Planta (cm)
                </label>
                <input
                  type="number"
                  value={mappingData.plantHeight}
                  onChange={(e) => setMappingData(prev => ({
                    ...prev,
                    plantHeight: parseInt(e.target.value) || 0
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Altura em cm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Nós Vegetativos
                </label>
                <input
                  type="number"
                  value={mappingData.vegetativeNodes}
                  onChange={(e) => setMappingData(prev => ({
                    ...prev,
                    vegetativeNodes: parseInt(e.target.value) || 0
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Número de nós vegetativos"
                />
              </div>
            </div>
          </div>
        )}

        {/* Mapping Tab */}
        {activeTab === 'mapping' && (
          <div className="space-y-6">
            {/* Tools */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Layers className="h-5 w-5 mr-2 text-green-600" />
                Ferramentas de Mapeamento
              </h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                  <div className="text-blue-800">
                    <p className="font-semibold mb-2">Como mapear:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Clique em uma posição na grade</li>
                      <li>Selecione o tipo de estrutura</li>
                      <li>Para remover, clique e escolha "Limpar"</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2 col-span-5">Legenda:</div>
                {structures.map(structure => (
                  <div key={structure.id} className="flex items-center space-x-2">
                    <div className={`w-6 h-6 ${structure.color} rounded flex items-center justify-center text-white text-sm font-bold`}>
                      {structure.symbol}
                    </div>
                    <span className="text-sm text-gray-700">{structure.name}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={analyzeMapping}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Calculator className="h-4 w-4" />
                  <span>Calcular</span>
                </button>
                <button
                  onClick={exportData}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={exportToPDF}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  disabled={!analysisResults}
                >
                  <FileText className="h-4 w-4" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Importar</span>
                </button>
                <button
                  onClick={clearGrid}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Limpar</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </div>

            {/* Grid */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Grid className="h-5 w-5 mr-2 text-green-600" />
                  Grade de Mapeamento - Planta {mappingData.plantHeight} cm
                </h2>
                <div className="text-sm text-gray-600">
                  Clique em uma posição para mapear
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                  {/* Header */}
                  <div className="flex mb-2">
                    <div className="w-16 h-8 bg-gray-100 border border-gray-300 flex items-center justify-center text-xs font-semibold">
                      Pos/Ramo
                    </div>
                    {[1, 2, 3, 4, 5, 6].map(col => (
                      <div key={col} className="w-16 h-8 bg-emerald-100 border border-emerald-300 flex items-center justify-center text-sm font-semibold">
                        {col}
                      </div>
                    ))}
                  </div>

                  {/* Grid */}
                  {mappingData.gridData.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex">
                      <div className="w-16 h-16 bg-green-100 border border-green-300 flex items-center justify-center text-sm font-semibold">
                        {rowIndex + 1}
                      </div>
                      {row.map((cell, colIndex) => (
                        <div
                          key={colIndex}
                          onClick={() => handleCellClick(rowIndex, colIndex)}
                          className={`w-16 h-16 border-2 cursor-pointer transition-all duration-200 flex items-center justify-center text-sm font-bold ${
                            cell.type 
                              ? `${structures.find(s => s.id === cell.type)?.color || 'bg-gray-300'} text-white border-gray-400 shadow-inner`
                              : 'bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-400'
                          }`}
                          title={cell.type ? 
                            `${structures.find(s => s.id === cell.type)?.name} - Posição ${rowIndex + 1}-${colIndex + 1}` : 
                            `Clique para mapear posição ${rowIndex + 1}-${colIndex + 1}`
                          }
                        >
                          {cell.type && (
                            <span className="drop-shadow">
                              {structures.find(s => s.id === cell.type)?.symbol}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p><strong>Instruções:</strong> Clique em uma posição para abrir o seletor de estruturas. 
                A grade representa ramos frutíferos (linhas) e posições nos ramos (colunas). 
                Para remover uma estrutura, clique na posição e selecione "Limpar".</p>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && analysisResults && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <TrendingUp className="h-6 w-6 mr-3 text-green-600" />
                Análise Quantitativa
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                {structures.map(structure => (
                  <div key={structure.id} className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                    <div className={`w-12 h-12 ${structure.color} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                      <span className="text-white font-bold text-lg">{structure.symbol}</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {analysisResults.counts[structure.id] || 0}
                    </div>
                    <div className="text-sm text-gray-600">{structure.name}</div>
                    <div className="text-xs text-green-600 font-semibold">
                      {analysisResults.percentages[structure.id]}%
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-blue-700 font-semibold text-sm">Total de Posições</div>
                  <div className="text-3xl font-bold text-blue-800">{analysisResults.totalPositions}</div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="text-green-700 font-semibold text-sm">Taxa de Retenção</div>
                  <div className="text-3xl font-bold text-green-800">{analysisResults.retention}%</div>
                </div>
                
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="text-red-700 font-semibold text-sm">Taxa de Aborto</div>
                  <div className="text-3xl font-bold text-red-800">{analysisResults.percentages.A}%</div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={exportToPDF}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 font-semibold"
                >
                  <FileText className="h-5 w-5" />
                  <span>Gerar Relatório PDF</span>
                </button>
                <button
                  onClick={exportData}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Download className="h-5 w-5" />
                  <span>Exportar JSON</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Structure Selection Modal */}
      {showStructureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 m-4 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Posição {modalPosition.row + 1}-{modalPosition.col + 1}
            </h3>
            
            <div className="space-y-3">
              {structures.map(structure => (
                <button
                  key={structure.id}
                  onClick={() => selectStructure(structure.id)}
                  className={`w-full p-3 rounded-lg border-2 transition-all duration-200 flex items-center space-x-3 hover:shadow-md ${structure.color.replace('bg-', 'hover:bg-').replace('-500', '-100')} hover:border-gray-400`}
                >
                  <div className={`w-8 h-8 ${structure.color} rounded flex items-center justify-center text-white font-bold`}>
                    {structure.symbol}
                  </div>
                  <span className="font-medium text-gray-700">{structure.name}</span>
                </button>
              ))}
              
              <button
                onClick={() => selectStructure('')}
                className="w-full p-3 rounded-lg border-2 border-red-200 transition-all duration-200 flex items-center space-x-3 hover:bg-red-50 hover:border-red-400"
              >
                <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center text-white">
                  <Trash2 className="h-4 w-4" />
                </div>
                <span className="font-medium text-gray-700">Limpar posição</span>
              </button>
              
              <button
                onClick={() => setShowStructureModal(false)}
                className="w-full p-3 rounded-lg border-2 border-gray-200 transition-all duration-200 flex items-center justify-center space-x-2 hover:bg-gray-50"
              >
                <span className="font-medium text-gray-500">Cancelar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600 text-sm">
          <p>Sistema de Mapeamento do Algodão - PWA</p>
          <p className="mt-1">Funciona offline • Baseado na metodologia IMAmt</p>
        </div>
      </footer>
    </div>
  );
};

export default CottonMappingSystem;