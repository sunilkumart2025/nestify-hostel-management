import React from 'react';
import { AlertCircle } from 'lucide-react';

const DemoNotice = ({ message }) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center">
        <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
        <div>
          <p className="text-sm font-medium text-blue-800">Demo Mode</p>
          <p className="text-sm text-blue-700">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default DemoNotice;