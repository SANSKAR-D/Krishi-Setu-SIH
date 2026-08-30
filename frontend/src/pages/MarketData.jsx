import React, { useState, useEffect } from 'react';
import { TrendingUp, MapPin, Search, Calendar, Package, AlertCircle, RefreshCw } from 'lucide-react';

const AGMARKNET_API = `${import.meta.env.VITE_GIS_URL || 'http://localhost:8001'}/api/agmarknet`;

export default function MarketData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [states, setStates] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);

  const [selectedState, setSelectedState] = useState('');

  // New state for daily report
  const [dailyReport, setDailyReport] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [searchCrop, setSearchCrop] = useState('');
  const [reportDate, setReportDate] = useState(null);
  const [cropSuggestions, setCropSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 1. Fetch initial dashboard data (States)
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${AGMARKNET_API}/states`, {
        headers: { 'Accept': 'application/json, text/plain, */*' }
      });
      if (!res.ok) throw new Error('API request failed');

      const data = await res.json();
      if (data.states && Array.isArray(data.states)) {
        // Sort alphabetically
        data.states.sort((a, b) => {
          const nameA = a.state_name || a.stateName || a.name || '';
          const nameB = b.state_name || b.stateName || b.name || '';
          return nameA.localeCompare(nameB);
        });
        setStates(data.states);
      } else if (data.error) {
        throw new Error(data.error);
      }

    } catch (err) {
      console.error('Failed to fetch states from python backend:', err);
      setError('Market data is currently unavailable. The server may be down.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // 2. Fetch Daily Report when a state is selected
  useEffect(() => {
    if (!selectedState) {
      setDailyReport([]);
      setReportDate(null);
      return;
    }

    const fetchStateReport = async () => {
      setLoadingReport(true);
      setSearchCrop('');
      try {
        const res = await fetch(`${AGMARKNET_API}/daily_report/${selectedState}`, {
          headers: { 'Accept': 'application/json, text/plain, */*' }
        });
        if (!res.ok) throw new Error('API blocked request');

        const result = await res.json();

        if (result.error) {
          console.error(result.error);
          setDailyReport([]);
          return;
        }

        // Backend now returns a flat array directly under result.data
        const reportData = Array.isArray(result.data) ? result.data : [];
        setDailyReport(reportData);
        setReportDate(result.date || null);

        // Build unique crop name suggestions for autocomplete
        const names = [...new Set(reportData.map(r => r.commodityName).filter(Boolean))].sort();
        setCropSuggestions(names);
      } catch (err) {
        console.error('Failed to fetch daily report:', err);
        setDailyReport([]);
      } finally {
        setLoadingReport(false);
      }
    };

    fetchStateReport();
  }, [selectedState]);

  // Client-side search filter for the daily report
  const filteredReport = dailyReport.filter(item => {
    if (!searchCrop) return true;
    const q = searchCrop.toLowerCase();
    const comm = (item.commodityName || item.commodity || item.commodity_name || '').toLowerCase();
    return comm.includes(q);
  });

  return (
    <div className="p-lg max-w-7xl mx-auto flex flex-col gap-lg h-full overflow-y-auto font-sans relative">

      {/* ─── Page Header & Controls ─── */}
      <div className="bg-surface-container-low border border-outline-variant rounded-3xl p-xl shadow-sm flex flex-col gap-md relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-lg">

          <div className="flex items-center gap-md">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-tertiary flex items-center justify-center shadow-lg shrink-0">
              <TrendingUp className="w-7 h-7 text-on-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-on-surface">Market Data Explorer</h1>
              <p className="text-on-surface-variant font-medium mt-1">Premium Real-Time Crop & Market Insights</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-sm bg-surface/50 backdrop-blur-md p-2 rounded-2xl border border-outline-variant/50 shadow-sm">
            <div className="relative flex-1 min-w-[200px] w-full">
              <MapPin className="w-5 h-5 text-primary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                className="h-12 w-full bg-surface pl-10 pr-4 rounded-xl border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary appearance-none font-semibold cursor-pointer shadow-sm transition-all hover:border-primary/50"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                disabled={loading}
              >
                <option value="">Select a State...</option>
                {states.map((s, i) => (
                  <option key={i} value={s.id || s.state_code_etaal || s.stateId}>{s.state_name || s.stateName || s.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="h-12 px-6 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-sm disabled:opacity-50 shadow-md w-full sm:w-auto hover:shadow-lg active:scale-95 shrink-0"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col gap-lg">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-surface-container-low rounded-3xl border border-outline-variant/50 shadow-sm">
            <RefreshCw className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-on-surface font-semibold text-lg">Connecting to Agmarknet...</p>
          </div>
        ) : error ? (
          <div className="bg-error-container text-on-error-container p-xl rounded-3xl flex flex-col items-center justify-center text-center gap-3 border border-error/20 shadow-sm">
            <AlertCircle className="w-14 h-14 shrink-0 opacity-80 text-error" />
            <p className="font-bold text-xl">API Connection Blocked</p>
            <p className="opacity-90 max-w-md">{error}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-lg animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">

            {/* National Monthly Trends (Shown when no state is selected) */}
            {!selectedState && monthlyTrend.length > 0 && (
              <div className="bg-surface-container-low rounded-3xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-outline-variant flex items-center gap-sm bg-surface-container-high/50">
                  <TrendingUp className="w-5 h-5 text-tertiary" />
                  <h2 className="text-lg font-bold text-on-surface">National Wholesale Price Trends (Monthly)</h2>
                </div>
                <div className="overflow-x-auto max-h-[50vh] custom-scrollbar">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-surface border-b border-outline-variant sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-6 py-4 font-extrabold text-on-surface-variant uppercase tracking-wider text-xs">Commodity</th>
                        <th className="px-6 py-4 font-extrabold text-on-surface-variant uppercase tracking-wider text-xs">Wholesale Price</th>
                        <th className="px-6 py-4 font-extrabold text-on-surface-variant uppercase tracking-wider text-xs text-right">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30">
                      {monthlyTrend.map((item, idx) => {
                        const isPositive = item.trend && item.trend.startsWith('+');
                        const trendColor = isPositive ? 'text-green-500' : 'text-red-500';
                        return (
                          <tr key={idx} className="hover:bg-surface-container transition-colors group">
                            <td className="px-6 py-4 font-bold text-on-surface">{item.commodity || item.comm_name || '—'}</td>
                            <td className="px-6 py-4 text-on-surface-variant font-medium">{item.price || item.modal_price || '—'}</td>
                            <td className={`px-6 py-4 text-right font-bold ${trendColor}`}>{item.trend || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Daily State Report */}
            {selectedState && (
              <div className="flex flex-col gap-lg">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-on-surface">
                    {states.find(s => (s.id || s.state_code_etaal || s.stateId) == selectedState)?.state_name || states.find(s => (s.id || s.state_code_etaal || s.stateId) == selectedState)?.name || states.find(s => (s.id || s.state_code_etaal || s.stateId) == selectedState)?.stateName || 'State'} Daily Report
                  </h2>
                  {reportDate && (
                    <span className="text-sm font-semibold bg-primary/20 text-primary px-4 py-1.5 rounded-full border border-primary/30 shadow-sm">
                      {reportDate}
                    </span>
                  )}
                </div>

                {loadingReport ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-surface-container-low rounded-3xl border border-outline-variant/50 shadow-sm">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary mb-4" />
                    <p className="text-on-surface font-medium">Fetching state report...</p>
                  </div>
                ) : filteredReport.length > 0 ? (
                  <div className="flex flex-col gap-lg">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                      <div className="bg-surface-container-low border border-outline-variant rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-on-surface-variant font-medium text-sm mb-2">Total Markets</p>
                        <p className="text-4xl font-extrabold text-on-surface">{new Set(filteredReport.map(item => item.marketName)).size}</p>
                      </div>
                      <div className="bg-surface-container-low border border-outline-variant rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-on-surface-variant font-medium text-sm mb-2">Total Commodities</p>
                        <p className="text-4xl font-extrabold text-on-surface">{new Set(filteredReport.map(item => item.commodityName)).size}</p>
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full md:w-96">
                      <Search className="w-5 h-5 text-primary absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search by crop name..."
                        className="h-12 bg-surface-container-low pl-12 pr-4 rounded-2xl border border-outline-variant text-on-surface w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm font-medium"
                        value={searchCrop}
                        onChange={(e) => { setSearchCrop(e.target.value); setShowSuggestions(true); }}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        onFocus={() => setShowSuggestions(true)}
                        autoComplete="off"
                      />
                      {showSuggestions && searchCrop && cropSuggestions.filter(s => s.toLowerCase().includes(searchCrop.toLowerCase())).length > 0 && (
                        <ul className="absolute z-50 top-full mt-1 left-0 right-0 bg-surface border border-outline-variant rounded-xl shadow-xl max-h-52 overflow-y-auto">
                          {cropSuggestions
                            .filter(s => s.toLowerCase().includes(searchCrop.toLowerCase()))
                            .slice(0, 10)
                            .map((s, i) => (
                              <li
                                key={i}
                                className="px-4 py-2.5 cursor-pointer hover:bg-primary/10 text-on-surface font-medium text-sm transition-colors"
                                onMouseDown={() => { setSearchCrop(s); setShowSuggestions(false); }}
                              >
                                {s}
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>

                    <div className="bg-surface-container-low rounded-3xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
                      <div className="overflow-x-auto max-h-[60vh] custom-scrollbar">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-surface border-b border-outline-variant sticky top-0 z-10 shadow-sm">
                            <tr>
                              <th className="px-6 py-5 font-extrabold text-on-surface-variant uppercase tracking-wider text-xs">Market</th>
                              <th className="px-6 py-5 font-extrabold text-on-surface-variant uppercase tracking-wider text-xs">Commodity</th>
                              <th className="px-6 py-5 font-extrabold text-on-surface-variant uppercase tracking-wider text-xs">Variety</th>
                              <th className="px-6 py-5 font-extrabold text-on-surface-variant uppercase tracking-wider text-xs text-right">Min Price</th>
                              <th className="px-6 py-5 font-extrabold text-on-surface-variant uppercase tracking-wider text-xs text-right">Max Price</th>
                              <th className="px-6 py-5 font-extrabold text-primary uppercase tracking-wider text-xs text-right bg-primary/5">Modal Price</th>
                              <th className="px-6 py-5 font-extrabold text-on-surface-variant uppercase tracking-wider text-xs text-right">Arrivals</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant/30">
                            {filteredReport.slice(0, 300).map((item, idx) => (
                              <tr key={idx} className="hover:bg-surface-container transition-colors group">
                                <td className="px-6 py-4 text-on-surface-variant font-medium">{item.marketName || '—'}</td>
                                <td className="px-6 py-4 font-bold text-on-surface">{item.commodityName || '—'}</td>
                                <td className="px-6 py-4 text-on-surface-variant">{item.variety || '—'}</td>
                                <td className="px-6 py-4 text-right text-on-surface-variant font-medium">{item.minPrice ? `₹${Number(item.minPrice).toLocaleString('en-IN')}` : '—'}</td>
                                <td className="px-6 py-4 text-right text-on-surface-variant font-medium">{item.maxPrice ? `₹${Number(item.maxPrice).toLocaleString('en-IN')}` : '—'}</td>
                                <td className="px-6 py-4 text-right text-primary font-bold bg-primary/5 group-hover:bg-primary/10 transition-colors text-base">{item.modalPrice ? `₹${Number(item.modalPrice).toLocaleString('en-IN')}` : '—'}</td>
                                <td className="px-6 py-4 text-right text-on-surface-variant">{item.arrivals != null ? `${item.arrivals} ${item.unitOfArrivals || 'MT'}` : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface-container-low p-xl rounded-3xl flex flex-col items-center justify-center text-center gap-md border border-outline-variant/50 py-20 shadow-sm">
                    <AlertCircle className="w-10 h-10 text-on-surface-variant opacity-50" />
                    <p className="font-bold text-lg text-on-surface">No data available</p>
                    <p className="text-on-surface-variant text-sm mt-1 max-w-sm mx-auto">
                      Could not load the daily report for the selected state.
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
}
