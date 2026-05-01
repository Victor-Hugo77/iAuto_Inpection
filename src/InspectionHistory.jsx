import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { X, Calendar, Package, Check, AlertTriangle, Eye, Car, Download, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

    const clearHistory = async () => {
        if (window.confirm('Tem certeza que deseja apagar TODO o histórico de inspeções? Esta ação não pode ser desfeita.')) {
            setLoading(true);
            try {
                const { error } = await supabase
                    .from('inspections')
                    .delete()
                    .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta tudo, assumindo UUIDs

                if (error) throw error;
                setInspections([]);
            } catch (error) {
                console.error('Erro ao limpar histórico:', error);
                alert('Ocorreu um erro ao limpar o histórico.');
            } finally {
                setLoading(false);
            }
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('pt-BR');
    };

    const [isExporting, setIsExporting] = useState(false);

    const exportCSV = () => {
        const headers = ['Data/Hora', 'Código', 'Modelo', 'Status'];
        const csvContent = [
            headers.join(','),
            ...inspections.map(item => [
                `"${formatDate(item.created_at)}"`,
                `"${item.barcode}"`,
                `"${item.model_name || '-'}"`,
                `"${item.status}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'historico_inspecoes.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportExcel = () => {
        const wsData = inspections.map(item => ({
            'Data / Hora': formatDate(item.created_at),
            'Código (Barcode)': item.barcode,
            'Modelo': item.model_name || '-',
            'Status': item.status
        }));
        const ws = XLSX.utils.json_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Histórico");
        XLSX.writeFile(wb, "historico_inspecoes.xlsx");
    };

    const getBase64ImageFromUrl = async (imageUrl) => {
        try {
            const res = await fetch(imageUrl);
            const blob = await res.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.addEventListener("load", function () {
                    resolve(reader.result);
                }, false);
                reader.onerror = () => reject(this);
                reader.readAsDataURL(blob);
            });
        } catch(e) {
            return null;
        }
    };

    const exportPDF = async () => {
        setIsExporting(true);
        try {
            const doc = new jsPDF('p', 'pt', 'a4');
            doc.setFontSize(16);
            doc.text('Histórico de Inspeções - iAutomotivo', 40, 40);

            const tableColumn = ["Data / Hora", "Código", "Modelo", "Status", "Evidência"];
            const tableRows = [];

            const processedData = await Promise.all(inspections.map(async (item) => {
                let base64Img = null;
                if (item.image_url) {
                    if (item.image_url.startsWith('data:image')) {
                        base64Img = item.image_url;
                    } else {
                        base64Img = await getBase64ImageFromUrl(item.image_url);
                    }
                }
                return {
                    date: formatDate(item.created_at),
                    barcode: item.barcode,
                    model: item.model_name || '-',
                    status: item.status,
                    image: base64Img
                };
            }));

            processedData.forEach(item => {
                const rowData = [
                    item.date,
                    item.barcode,
                    item.model,
                    item.status,
                    item.image ? '' : 'Sem img'
                ];
                tableRows.push(rowData);
            });

            doc.autoTable({
                startY: 50,
                head: [tableColumn],
                body: tableRows,
                styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
                columnStyles: {
                    4: { cellWidth: 80, minCellHeight: 40 }
                },
                didDrawCell: (data) => {
                    if (data.column.index === 4 && data.cell.section === 'body') {
                        const imgData = processedData[data.row.index].image;
                        if (imgData) {
                            try {
                                doc.addImage(imgData, 'JPEG', data.cell.x + 2, data.cell.y + 2, 76, 36);
                            } catch(e) {
                                console.error('Error drawing image in pdf', e);
                            }
                        }
                    }
                }
            });

            doc.save('historico_inspecoes.pdf');
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            alert("Ocorreu um erro ao gerar o PDF. Tente novamente.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-100/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-6xl h-[80vh] rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Package className="text-blue-600" /> Histórico de Inspeções
                    </h2>
                    
                    <div className="flex items-center gap-2">
                        {/* Export Buttons */}
                        <div className="flex gap-2 mr-4 pr-4 border-r border-slate-200">
                            <button onClick={exportCSV} disabled={inspections.length === 0} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Download size={12} /> CSV
                            </button>
                            <button onClick={exportExcel} disabled={inspections.length === 0} className="px-3 py-1.5 bg-white border border-slate-300 text-green-700 hover:bg-green-50 hover:text-green-800 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Download size={12} /> EXCEL
                            </button>
                            <button onClick={exportPDF} disabled={inspections.length === 0 || isExporting} className="px-3 py-1.5 bg-red-600 border border-red-700 text-white hover:bg-red-500 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed w-20 justify-center">
                                {isExporting ? (
                                    <span className="flex items-center gap-1"><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span> PDF</span>
                                ) : (
                                    <><Download size={12} /> PDF</>
                                )}
                            </button>
                        </div>
                        
                        {/* Clear History Button */}
                        <div className="mr-4 pr-4 border-r border-slate-200">
                            <button onClick={clearHistory} disabled={inspections.length === 0} className="px-3 py-1.5 bg-white border border-slate-300 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed" title="Apagar Todo o Histórico">
                                <Trash2 size={12} /> LIMPAR HISTÓRICO
                            </button>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-slate-800"
                        >
                            <X size={24} />
                        </button>
                    </div>
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
