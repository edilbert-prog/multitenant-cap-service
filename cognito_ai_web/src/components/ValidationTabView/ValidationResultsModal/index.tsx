// import React from 'react';
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
// import { Button } from '../ui/button';
// import { CheckCircle2, XCircle } from 'lucide-react';
// import ValidationReport from '../ValidationReport';
// import { ScrollArea } from '../ui/scroll-area';

// interface ValidationResponse {
//   status: boolean;
//   message: string;
//   data: any; // Can be array or object depending on API response
// }

// interface ValidationResultsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   results: ValidationResponse | null;
// }

// export default function ValidationResultsModal({ isOpen, onClose, results }: ValidationResultsModalProps) {
//   if (!results?.data) {
//     return null;
//   }

//   // Handle error responses where data is an empty array
//   if (Array.isArray(results.data) && results.data.length === 0) {
//     return (
//       <Dialog open={isOpen} onOpenChange={onClose}>
//         <DialogContent className="max-w-[95vw] h-[95vh] flex flex-col">
//           <DialogHeader>
//             <DialogTitle className="text-xl font-bold text-red-600">Validation Error</DialogTitle>
//           </DialogHeader>
//           <div className="flex flex-col items-center justify-center p-8 text-center">
//             <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
//               <XCircle className="h-8 w-8 text-red-500" />
//             </div>
//             <h3 className="text-lg font-semibold text-gray-800 mb-2">
//               {results.message || "Validation execution failed"}
//             </h3>
//             <p className="text-sm text-gray-600">
//               The validation could not be executed. Please check your validation configuration and try again.
//             </p>
//           </div>
//           <div className="flex justify-end gap-2 pt-4 border-t">
//             <Button variant="outline" onClick={onClose}>
//               Close
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     );
//   }

//   // The new API response structure - data is now an array with header, summary, field_summary, and line_items
//   const responseData = Array.isArray(results.data) ? results.data[0] : results.data; 

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-[95vw] h-[95vh] gap-2 flex flex-col p-0 overflow-hidden">
//         <DialogHeader className="p-3 pb-3 border-b bg-gradient-to-r from-gray-50 to-slate-100 text-gray-800">
//           <div className="flex items-center justify-between">
//             <DialogTitle className="text-xl font-semibold flex items-center gap-2">
//               <CheckCircle2 className="h-5 w-5 text-gray-600" />
//               Validation Results
//             </DialogTitle>
           
//           </div>
//         </DialogHeader>
//         <div className="flex-1 min-h-0 overflow-auto">
//           <ScrollArea className="h-full w-full">
//             <ValidationReport data={responseData} />
//           </ScrollArea>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }


import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';
import ValidationReport from '../ValidationReport';
import { ScrollArea } from '../ui/scroll-area';
import TableWiseValidationReport from '../ValidationReport';

interface ValidationResponse {
  status: boolean;
  message: string;
  data: any; // Can be array or object depending on API response
}

interface ValidationResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: ValidationResponse | null;
}

export default function ValidationResultsModal({ isOpen, onClose, results }: ValidationResultsModalProps) {
  if (!results?.data) {
    return null;
  }

  // Handle error responses where data is an empty array
  if (Array.isArray(results.data) && results.data.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">Validation Error</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {results.message || "Validation execution failed"}
            </h3>
            <p className="text-sm text-gray-600">
              The validation could not be executed. Please check your validation configuration and try again.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // The new API response structure - data is now an array with header, summary, field_summary, line_items, and table_wise_data
  const responseData = Array.isArray(results.data) ? results.data[0] : results.data;

  // Check if this is the new table-wise data format
  const hasTableWiseData = responseData && responseData.table_wise_data && Array.isArray(responseData.table_wise_data) && responseData.table_wise_data.length > 0;

  // Use the new table-wise component if the data has the new structure
  if (hasTableWiseData) {
    return <TableWiseValidationReport isOpen={isOpen} onClose={onClose} data={responseData} />;
  }

  // Otherwise use the old component
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[95vh] gap-2 flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-3 pb-3 border-b bg-gradient-to-r from-gray-50 to-slate-100 text-gray-800">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-gray-600" />
              Validation Results
            </DialogTitle>
           
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-auto">
          <ScrollArea className="h-full w-full">
            <ValidationReport data={responseData} isOpen={false} onClose={function (): void {
              throw new Error('Function not implemented.');
            } } />
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}


