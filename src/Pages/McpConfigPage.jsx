import React, { useEffect, useState, useCallback } from 'react';
import {
  Plug,
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  Power,
  PowerOff,
  Clock,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import mcpConfigService from '../services/mcpConfigService';

// ── Snippets de configuración para cada cliente ──────────────────────────────

function buildConfigs(serverUrl, apiKey) {
  const claudeDesktop = JSON.stringify(
    {
      mcpServers: {
        superadmin: {
          type: 'http',
          url: serverUrl,
          headers: { Authorization: `Bearer ${apiKey}` },
        },
      },
    },
    null,
    2
  );

  const vsCode = JSON.stringify(
    {
      servers: {
        superadmin: {
          type: 'http',
          url: serverUrl,
          headers: { Authorization: `Bearer ${apiKey}` },
        },
      },
    },
    null,
    2
  );

  const reptil = JSON.stringify(
    {
      name: 'superadmin',
      type: 'streamable_http',
      url: serverUrl,
      authType: 'bearer',
      credentials: { token: apiKey },
    },
    null,
    2
  );

  return { claudeDesktop, vsCode, reptil };
}

// ── Componente de copia ──────────────────────────────────────────────────────

function CopyButton({ text, className = '' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* no-op */
    }
  };

  return (
    <button
      onClick={handleCopy}
      title="Copiar"
      className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${className}`}
    >
      {copied ? (
        <Check size={15} className="text-green-600" />
      ) : (
        <Copy size={15} className="text-gray-500" />
      )}
    </button>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function McpConfigPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rotating, setRotating] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState('claude');

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await mcpConfigService.getConfig();
      setConfig(data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al cargar la configuración MCP');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleRotate = async () => {
    if (!window.confirm('¿Rotar la API Key? Los clientes actuales dejarán de funcionar hasta que los actualices.')) return;
    try {
      setRotating(true);
      const data = await mcpConfigService.rotateKey();
      setConfig((prev) => ({
        ...prev,
        apiKey: data.apiKey,
        apiKeyMasked: data.apiKeyMasked,
        updatedAt: data.updatedAt,
      }));
      setShowKey(true); // Mostrar automáticamente la nueva clave
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al rotar la API Key');
    } finally {
      setRotating(false);
    }
  };

  const handleToggle = async () => {
    try {
      setToggling(true);
      const data = await mcpConfigService.toggle();
      setConfig((prev) => ({ ...prev, enabled: data.enabled }));
    } catch (err) {
      setError(err?.response?.data?.error || 'Error al cambiar el estado');
    } finally {
      setToggling(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-4 bg-red-50 rounded-xl border border-red-200 flex gap-3">
        <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
        <div>
          <p className="font-medium text-red-700">No se pudo cargar la configuración</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <button onClick={loadConfig} className="mt-2 text-sm text-indigo-600 hover:underline">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const configs = config ? buildConfigs(config.serverUrl, showKey ? config.apiKey : '••••••••••••••••••••••••••••••••') : null;
  const realConfigs = config ? buildConfigs(config.serverUrl, config.apiKey) : null;

  const tabs = [
    { id: 'claude', label: 'Claude Desktop' },
    { id: 'vscode', label: 'VS Code' },
    { id: 'reptil', label: 'Reptil / Otro' },
  ];

  const activeConfig = realConfigs
    ? activeTab === 'claude'
      ? realConfigs.claudeDesktop
      : activeTab === 'vscode'
      ? realConfigs.vsCode
      : realConfigs.reptil
    : '';

  const displayConfig = configs
    ? activeTab === 'claude'
      ? configs.claudeDesktop
      : activeTab === 'vscode'
      ? configs.vsCode
      : configs.reptil
    : '';

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-xl">
          <Plug size={24} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Acceso MCP</h1>
          <p className="text-sm text-gray-500">
            Conecta agentes AI e integraciones externas a tu aplicación
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex gap-2 items-start">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Estado del endpoint */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                config?.enabled ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
            <div>
              <p className="font-medium text-gray-900">
                Endpoint MCP{' '}
                <span
                  className={`text-sm font-normal ${
                    config?.enabled ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  {config?.enabled ? 'activo' : 'deshabilitado'}
                </span>
              </p>
              <p className="text-sm text-gray-500 font-mono mt-0.5 flex items-center gap-1.5">
                {config?.serverUrl}
                <CopyButton text={config?.serverUrl || ''} />
              </p>
            </div>
          </div>
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              config?.enabled
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >
            {toggling ? (
              <Loader2 size={14} className="animate-spin" />
            ) : config?.enabled ? (
              <PowerOff size={14} />
            ) : (
              <Power size={14} />
            )}
            {config?.enabled ? 'Deshabilitar' : 'Habilitar'}
          </button>
        </div>

        {config?.lastAccess && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs text-gray-500">
            <Clock size={12} />
            Último acceso MCP:{' '}
            {new Date(config.lastAccess).toLocaleString('es-PE', {
              timeZone: 'America/Lima',
            })}
          </div>
        )}
      </div>

      {/* API Key */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <KeyRound size={18} className="text-indigo-500" />
            <h2 className="font-semibold text-gray-900">API Key</h2>
          </div>
          <button
            onClick={handleRotate}
            disabled={rotating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors font-medium"
          >
            {rotating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Rotar clave
          </button>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 font-mono text-sm">
          <span className="flex-1 text-gray-800 break-all">
            {showKey ? config?.apiKey : config?.apiKeyMasked}
          </span>
          <button
            onClick={() => setShowKey((v) => !v)}
            className="p-1.5 rounded hover:bg-gray-200 transition-colors flex-shrink-0"
            title={showKey ? 'Ocultar' : 'Mostrar'}
          >
            {showKey ? (
              <EyeOff size={15} className="text-gray-500" />
            ) : (
              <Eye size={15} className="text-gray-500" />
            )}
          </button>
          {showKey && <CopyButton text={config?.apiKey || ''} />}
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Rotar la clave invalida inmediatamente los clientes actuales. Actualiza la configuración
          de cada cliente después de rotar.
        </p>
      </div>

      {/* Snippets de configuración */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Configuración para clientes</h2>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Instrucción por cliente */}
        <p className="text-xs text-gray-500 mb-3">
          {activeTab === 'claude' && (
            <>
              Pega esto en{' '}
              <code className="bg-gray-100 px-1 rounded">
                %APPDATA%\Claude\claude_desktop_config.json
              </code>{' '}
              (Windows) o{' '}
              <code className="bg-gray-100 px-1 rounded">
                ~/Library/Application Support/Claude/claude_desktop_config.json
              </code>{' '}
              (Mac)
            </>
          )}
          {activeTab === 'vscode' && (
            <>
              Pega esto en el archivo{' '}
              <code className="bg-gray-100 px-1 rounded">.vscode/mcp.json</code> en la raíz de
              tu workspace
            </>
          )}
          {activeTab === 'reptil' && (
            <>
              Usa estos datos al crear un nuevo conector en Reptil u otra plataforma MCP
            </>
          )}
        </p>

        {/* Snippet */}
        <div className="relative">
          <pre className="bg-gray-900 text-green-300 rounded-lg p-4 text-xs overflow-x-auto leading-relaxed">
            {displayConfig}
          </pre>
          <div className="absolute top-2 right-2">
            <CopyButton
              text={activeConfig}
              className="bg-gray-800 hover:bg-gray-700 rounded"
            />
          </div>
        </div>

        {!showKey && (
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5">
            <Eye size={12} />
            Muestra la API Key arriba para ver el snippet completo con la clave real
          </p>
        )}
      </div>
    </div>
  );
}
