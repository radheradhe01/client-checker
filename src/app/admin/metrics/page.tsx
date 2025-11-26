'use client';

import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c'];

export default function MetricsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/admin/metrics');
                const json = await res.json();
                setData(json);
            } catch (error) {
                console.error('Failed to fetch metrics', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-center">Loading metrics...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">Failed to load data</div>;

    return (
        <div className="space-y-8">
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Performance Metrics
                    </h2>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Leads</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">{data.totalLeads}</dd>
                    </div>
                </div>
                {/* Add more summary cards if needed */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart 1: Pipeline Distribution */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Lead Distribution by Stage</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data.statusData}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="value" name="Leads" fill="#4F46E5" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 2: Employee Workload */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Leads per Employee</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.employeeData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${percent !== null && percent !== undefined ? (percent * 100).toFixed(0) : 0}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {data.employeeData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
