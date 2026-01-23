import React from 'react';
import { Wrench } from 'lucide-react';

const MaintenancePage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="text-center max-w-lg">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-orange-100 rounded-full">
                        <Wrench className="w-12 h-12 text-orange-600" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Under Maintenance
                </h1>

                <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                    The system is undergoing important technical adjustments to improve our infrastructure.
                    <br /><br />
                    We are working to restore access as quickly as possible. Thank you for your patience.
                </p>

                <div className="text-sm text-gray-500">
                    Brazil Continuous Improvement
                </div>
            </div>
        </div>
    );
};

export default MaintenancePage;
