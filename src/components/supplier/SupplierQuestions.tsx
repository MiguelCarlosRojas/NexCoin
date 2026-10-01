import React, { useState, useEffect, useMemo } from 'react';
import { SupplierLayout } from './SupplierLayout';
import { useSupplier } from '../../context/SupplierContext';
import {
  fetchSupplierQuestions,
  answerProductQuestion,
  ProductQuestion
} from '../../lib/qaAndReviewsService';
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  Send,
  ExternalLink
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export const SupplierQuestions: React.FC = () => {
  const { supplier } = useSupplier();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlFiltro = (searchParams.get('filtro') || searchParams.get('filter') || '').toLowerCase();
  const urlQ = searchParams.get('q') || searchParams.get('search') || '';

  const getInitialFilterTab = (f: string): 'all' | 'pending' | 'answered' => {
    if (f === 'pendientes' || f === 'pending') return 'pending';
    if (f === 'respondidas' || f === 'answered') return 'answered';
    return 'all';
  };

  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(urlQ);
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'answered'>(getInitialFilterTab(urlFiltro));

  const syncUrlParams = (fVal: string, qVal: string) => {
    const params: Record<string, string> = {};
    if (fVal === 'pending') params.filtro = 'pendientes';
    else if (fVal === 'answered') params.filtro = 'respondidas';
    else params.filtro = 'todas';

    if (qVal.trim()) params.q = qVal.trim();
    setSearchParams(params, { replace: true });
  };

  const handleFilterTabChange = (newTab: 'all' | 'pending' | 'answered') => {
    setFilterTab(newTab);
    syncUrlParams(newTab, search);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    syncUrlParams(filterTab, newSearch);
  };

  // Answer draft state per question ID
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadQuestions = async () => {
    if (!supplier) return;
    setLoading(true);
    try {
      const data = await fetchSupplierQuestions(supplier.id);
      setQuestions(data);
    } catch (err) {
      console.error('Error loading supplier questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [supplier]);

  const handleAnswerSubmit = async (questionId: string) => {
    const text = answerDrafts[questionId]?.trim();
    if (!text) return;

    setSubmittingId(questionId);
    try {
      await answerProductQuestion(questionId, text);
      setToastMessage('Respuesta enviada y publicada con éxito en la tienda');
      setTimeout(() => setToastMessage(null), 3000);
      
      // Update local state
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? { ...q, answer: text, answered_at: new Date().toISOString() }
            : q
        )
      );
      // Clear draft
      setAnswerDrafts((prev) => ({ ...prev, [questionId]: '' }));
    } catch (err) {
      console.error('Error answering question:', err);
    } finally {
      setSubmittingId(null);
    }
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        q.question.toLowerCase().includes(term) ||
        (q.answer && q.answer.toLowerCase().includes(term)) ||
        (q.product_name && q.product_name.toLowerCase().includes(term)) ||
        q.user_name.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      if (filterTab === 'pending') return !q.answer;
      if (filterTab === 'answered') return Boolean(q.answer);

      return true;
    });
  }, [questions, search, filterTab]);

  // Pagination: 10 records per page
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterTab]);

  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE) || 1;
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQuestions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredQuestions, currentPage]);

  const pendingCount = questions.filter((q) => !q.answer).length;
  const answeredCount = questions.filter((q) => Boolean(q.answer)).length;

  return (
    <SupplierLayout
      title="Preguntas de Clientes & Respuestas"
      subtitle="Responde las dudas de tus compradores en tiempo real para acelerar tus ventas."
    >
      <div className="space-y-6 w-full max-w-full">
        
        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-950/95 border border-emerald-500/40 text-emerald-200 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#0a0f1d]/90 border border-white/[0.08] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase font-bold text-slate-400">Total Consultas</span>
              <MessageSquare className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-3xl font-black text-white mt-2 font-heading">{questions.length}</p>
            <p className="text-[11px] text-slate-400 mt-1">Preguntas realizadas por compradores</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0a0f1d]/90 border border-white/[0.08] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase font-bold text-amber-400">Pendientes de Respuesta</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-black text-amber-400 mt-2 font-heading">{pendingCount}</p>
            <p className="text-[11px] text-slate-400 mt-1">Requieren atención del proveedor</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0a0f1d]/90 border border-white/[0.08] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase font-bold text-emerald-400">Respondidas con Éxito</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-black text-emerald-400 mt-2 font-heading">{answeredCount}</p>
            <p className="text-[11px] text-slate-400 mt-1">Publicadas en el catálogo de la tienda</p>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-[#0a0f1d]/90 border border-white/[0.08] p-4 sm:p-5 rounded-2xl backdrop-blur-xl shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por pregunta, respuesta, producto o cliente..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-[#060911] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
              />
              {search && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-white/[0.06] rounded-xl text-xs overflow-x-auto">
              <button
                onClick={() => handleFilterTabChange('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                  filterTab === 'all'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todas ({questions.length})
              </button>
              <button
                onClick={() => handleFilterTabChange('pending')}
                className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  filterTab === 'pending'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Pendientes ({pendingCount})</span>
              </button>
              <button
                onClick={() => handleFilterTabChange('answered')}
                className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  filterTab === 'answered'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Respondidas ({answeredCount})</span>
              </button>
            </div>

          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-5 sm:p-6 rounded-3xl bg-[#0a0f1d]/90 border border-white/[0.08] space-y-4 animate-pulse">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/[0.05]" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 bg-white/[0.06] rounded w-48" />
                        <div className="h-2.5 bg-white/[0.04] rounded w-28" />
                      </div>
                    </div>
                    <div className="h-6 bg-white/[0.06] rounded-full w-24" />
                  </div>
                  <div className="h-4 bg-white/[0.05] rounded w-3/4" />
                  <div className="h-10 bg-white/[0.03] rounded-xl w-full" />
                </div>
              ))}
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="p-16 text-center text-slate-500 bg-[#0a0f1d]/90 border border-white/[0.08] rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mx-auto mb-3 text-slate-600">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-base font-bold text-slate-300">No hay preguntas con los filtros seleccionados</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Las dudas que tus clientes escriban en la página de producto aparecerán aquí automáticamente.
              </p>
            </div>
          ) : (
            paginatedQuestions.map((q) => {
              const isAnswered = Boolean(q.answer);
              const draft = answerDrafts[q.id] ?? '';

              return (
                <div
                  key={q.id}
                  className="p-5 sm:p-6 rounded-3xl bg-[#0a0f1d]/90 border border-white/[0.08] shadow-xl backdrop-blur-xl space-y-4"
                >
                  {/* Header: Product & Meta */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {q.product_name || 'Producto del Catálogo'}
                          </span>
                          <Link
                            to={`/producto/${q.product_id}`}
                            target="_blank"
                            className="text-slate-400 hover:text-amber-400 transition"
                            title="Ver en la tienda"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Preguntado por <strong className="text-slate-300">{q.user_name}</strong> {q.user_email ? `(${q.user_email})` : ''} • {new Date(q.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      {isAnswered ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Respondida
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          Pendiente de respuesta
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Body */}
                  <div className="space-y-2">
                    <div className="p-3.5 rounded-2xl bg-[#060911] border border-white/[0.06] text-xs sm:text-sm text-slate-200 leading-relaxed">
                      <span className="text-amber-400 font-mono font-bold mr-2 text-xs">PREGUNTA:</span>
                      {q.question}
                    </div>

                    {/* Answer section if answered */}
                    {isAnswered ? (
                      <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-xs sm:text-sm text-slate-200 leading-relaxed ml-4 border-l-4 border-l-emerald-500">
                        <div className="flex items-center justify-between text-[10px] text-emerald-400 font-mono font-bold uppercase mb-1">
                          <span>Tu Respuesta Oficial:</span>
                          {q.answered_at && <span>{new Date(q.answered_at).toLocaleDateString()}</span>}
                        </div>
                        <p className="text-xs text-slate-300">{q.answer}</p>
                      </div>
                    ) : (
                      /* Reply Box */
                      <div className="pt-2 space-y-2 ml-2">
                        <textarea
                          rows={2}
                          placeholder="Escribe la respuesta oficial para el cliente (se publicará en la página del producto)..."
                          value={draft}
                          onChange={(e) =>
                            setAnswerDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                          className="w-full bg-[#060911] border border-white/[0.1] rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition resize-none"
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleAnswerSubmit(q.id)}
                            disabled={!draft.trim() || submittingId === q.id}
                            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 text-black font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{submittingId === q.id ? 'Publicando...' : 'Publicar Respuesta'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Controles de paginación (10 preguntas por página) */}
        {filteredQuestions.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0a0f1d]/90 border border-white/[0.08] text-xs text-slate-400">
            <div>
              Mostrando <span className="text-white font-bold">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredQuestions.length)}</span> - <span className="text-white font-bold">{Math.min(currentPage * ITEMS_PER_PAGE, filteredQuestions.length)}</span> de <span className="text-white font-bold">{filteredQuestions.length}</span> preguntas (10 por página)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.1] hover:border-amber-500/50 text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Anterior
              </button>
              <span className="font-mono text-xs px-2">
                Página <strong className="text-amber-400">{currentPage}</strong> de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.1] hover:border-amber-500/50 text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

      </div>
    </SupplierLayout>
  );
};
