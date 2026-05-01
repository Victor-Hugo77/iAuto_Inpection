import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { X, Calendar, Package, Check, AlertTriangle, Eye, Car } from 'lucide-react';

const InspectionHistory = ({ onClose }) => {
    const [inspections, setInspections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        fetchInspections();
    }, []);

    const fetchInspections = async () => {
        try {
            const { data, error } = await supabase
                .from('inspections')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            setInspections(data);
        } catch (error) {
            console.error('Erro ao buscar histórico:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('pt-BR');
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-100/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-6xl h-[80vh] rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Package className="text-blue-600" /> Histórico de Inspeções
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-slate-800"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-slate-500">
                            Carregando dados...
                        </div>
                    ) : inspections.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-400">
                            Nenhum registro encontrado.
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="text-xs uppercase text-slate-500 bg-slate-50 sticky top-0">
                                <tr>
                                    <th className="p-3 rounded-tl-lg">Data / Hora</th>
                                    <th className="p-3">Código (Barcode)</th>
                                    <th className="p-3">Modelo</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3 rounded-tr-lg text-center">Evidência</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-slate-100">
                                {inspections.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-3 text-slate-600 font-mono">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-slate-400" />
                                                {formatDate(item.created_at)}
                                            </div>
                                        </td>
                                        <td className="p-3 text-slate-900 font-bold font-mono tracking-wider">
                                            {item.barcode}
                                        </td>
                                        <td className="p-3 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <Car size={14} className="text-slate-400" />
                                                {item.model_name || '-'}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            {item.status === 'APROVADO' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-600 text-xs font-bold border border-green-200">
                                                    <Check size={12} /> APROVADO
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-200">
                                                    <AlertTriangle size={12} /> REPROVADO
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            {item.image_url ? (
                                                <button
                                                    onClick={() => setSelectedImage(item.image_url)}
                                                    className="relative group overflow-hidden rounded border border-slate-200 w-16 h-10 inline-block hover:border-blue-500 transition-colors"
                                                >
                                                    <img
                                                        src={item.image_url}
                                                        alt="Evidence"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-white/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <Eye size={16} className="text-blue-600" />
                                                    </div>
                                                </button>
                                            ) : (
                                                <span className="text-slate-400 text-xs italic">Sem img</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-400 flex justify-between">
                    <span>Mostrando últimos 100 registros</span>
                    <span>Total: {inspections.length}</span>
                </div>
            </div>

            {/* Image Full Screen Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[70] bg-slate-900/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 p-2 rounded-full transition-colors z-50 shadow-lg"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X size={32} />
                    </button>

                    <img
                        src={selectedImage}
                        alt="Full Screen Evidence"
                        className="max-w-full max-h-full rounded shadow-2xl border border-white"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default InspectionHistory;
