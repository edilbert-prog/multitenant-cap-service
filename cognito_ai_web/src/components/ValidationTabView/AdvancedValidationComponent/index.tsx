import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { getApplicationsApi } from "../API/validationApi";
import { useEffect, useState } from "react";


// const TableConfigurationFilter: React.FC = () => {
//   // Mock data for dropdowns. In a real application, this would come from an API.
//   const applications = ['SAP S/4HANA', 'SAP ECC', 'SAP CRM', 'SAP Ariba'];
//   const objectTypes = ['Table', 'View', 'Program', 'Function Module'];
//   const modules = ['FI', 'CO', 'SD', 'MM', 'PP', 'HR'];
//   const subModules = ['FI-GL', 'FI-AP', 'FI-AR', 'SD-BIL', 'MM-PUR'];
//   const objects = ['BKPF', 'BSEG', 'MARA', 'VBAK', 'LFA1'];
//   const tcodes = ['FB01', 'VA01', 'MM01', 'ME21N', 'VF01'];

//   return (
//     <div className="bg-white p-8 rounded-xl shadow-sm w-full max-w-7xl">
//       <div className="flex flex-col lg:flex-row items-start lg:items-end gap-6">
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 flex-grow">
//           <div className="grid w-full items-center gap-1.5">
//             <Label htmlFor="application" className="font-semibold text-gray-800">Application</Label>
//             <Select>
//               <SelectTrigger id="application" className="bg-white">
//                 <SelectValue placeholder="Select..." />
//               </SelectTrigger>
//               <SelectContent>
//                 {applications.map((app) => (
//                   <SelectItem key={app} value={app}>{app}</SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="grid w-full items-center gap-1.5">
//             <Label htmlFor="object-type" className="font-semibold text-gray-800">Object Type</Label>
//             <Select>
//               <SelectTrigger id="object-type" className="bg-white">
//                 <SelectValue placeholder="Select..." />
//               </SelectTrigger>
//               <SelectContent>
//                 {objectTypes.map((type) => (
//                   <SelectItem key={type} value={type}>{type}</SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="grid w-full items-center gap-1.5">
//             <Label htmlFor="module" className="font-semibold text-gray-800">Module</Label>
//             <Select>
//               <SelectTrigger id="module" className="bg-white">
//                 <SelectValue placeholder="Select..." />
//               </SelectTrigger>
//               <SelectContent>
//                 {modules.map((mod) => (
//                   <SelectItem key={mod} value={mod}>{mod}</SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="grid w-full items-center gap-1.5">
//             <Label htmlFor="sub-module" className="font-semibold text-gray-800">Sub Module</Label>
//             <Select>
//               <SelectTrigger id="sub-module" className="bg-white">
//                 <SelectValue placeholder="Select..." />
//               </SelectTrigger>
//               <SelectContent>
//                 {subModules.map((sub) => (
//                   <SelectItem key={sub} value={sub}>{sub}</SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="grid w-full items-center gap-1.5">
//             <Label htmlFor="object" className="font-semibold text-gray-800">Object</Label>
//             <Select>
//               <SelectTrigger id="object" className="bg-white">
//                 <SelectValue placeholder="Select..." />
//               </SelectTrigger>
//               <SelectContent>
//                 {objects.map((obj) => (
//                   <SelectItem key={obj} value={obj}>{obj}</SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="grid w-full items-center gap-1.5">
//             <Label htmlFor="tcode" className="font-semibold text-gray-800">Tcode</Label>
//             <Select>
//               <SelectTrigger id="tcode" className="bg-white">
//                 <SelectValue placeholder="Select..." />
//               </SelectTrigger>
//               <SelectContent>
//                 {tcodes.map((tcode) => (
//                   <SelectItem key={tcode} value={tcode}>{tcode}</SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="grid w-full items-center gap-1.5">
//             <Label htmlFor="vc-id" className="font-semibold text-gray-800">VC ID</Label>
//             <Input type="text" id="vc-id" placeholder="Enter VC ID" className="bg-white" />
//           </div>

//           <div className="grid w-full items-center gap-1.5">
//             <Label htmlFor="vc-description" className="font-semibold text-gray-800">VC Description</Label>
//             <Input type="text" id="vc-description" placeholder="Enter Description" className="bg-white" />
//           </div>
//         </div>

//         <div className="flex-shrink-0 w-full lg:w-auto mt-4 lg:mt-0">
//           <Button className="bg-black text-white hover:bg-gray-900 w-full lg:w-auto px-8 py-2.5 h-auto rounded-lg text-base">Apply</Button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TableConfigurationFilter;

const FormField = ({ id, label, children }: { id: string, label: string, children: React.ReactNode }) => (
  <div className="grid w-full items-center gap-1.5">
    <Label htmlFor={id}>{label}</Label>
    {children}
  </div>
);

const TableConfigurationFilter = ({onApply}: {onApply: (validationObject: any) => void}) => {

  const [application, setApplication] = useState([]);
    const [module, setModule] = useState([]);
    const [subModule, setSubModule] = useState([]);
    const [object, setObject] = useState([]);
    const [tcode, setTcode] = useState([]);
    const [validationObject, setValidationObject] = useState({
      application: '',
      object_type: '',
      module: '',
      sub_module: '',
      object: '',
      tcode: '',
      validation_id: '',
      validation_description: '',
    });
  
    useEffect(() => {
      getApplications();
    }, []);
  
    const getApplications = async () => {
      let params: any = {
        "application_id": "",
        "object_type": "",
        "module": "",
        "sub_module": "",
        "object": "",
        "type": "application"
      }
  
      let response =  await getApplicationsApi(params);
      if (response.status) {
        setApplication(response.data);
      }
    }
  
    const getModules = async (applicationId: string) => {
      let params: any = {
        "application_id": applicationId,
        "object_type": validationObject.object_type,
        "module": "",
        "sub_module": "",
        "object": "",
        "tcode": "",
        "type": "module"
      }
  
      let response =  await getApplicationsApi(params);
      if (response.status) {
        validationObject.application = applicationId;
        setModule(response.data);
      }
    }
  
    const getSubModules = async (moduleId: string) => {
      let params: any = {
        "application_id": validationObject.application,
        "object_type": validationObject.object_type,
        "module": moduleId,
        "sub_module": "",
        "object": "",
        "tcode": "",
        "type": "sub_module"
      }
  
      let response =  await getApplicationsApi(params);
      if (response.status) {
        validationObject.module = moduleId;
        setSubModule(response.data);
      }
    }
  
    const getObjects = async (subModuleId: string) => {
      let params: any = {
        "application_id": validationObject.application,
        "object_type": validationObject.object_type,
        "module": validationObject.module,
        "sub_module": subModuleId,
        "object": "",
        "tcode": "",
        "type": "object"
      }
  
      let response =  await getApplicationsApi(params);
      if (response.status) {
        validationObject.sub_module = subModuleId;
        setObject(response.data);
      }
      
    }

    const handleApply = (tcode: string) => {
      validationObject.tcode = tcode;
      validationObject.validation_id = validationObject.validation_id;
      validationObject.validation_description = validationObject.validation_description;
      onApply(validationObject);
    }

    // const getTransactionIds = async (transactionId: string) => {
    //   let params: any = {
    //     "application_id": validationObject.application,
    //     "object_type": validationObject.object_type,
    //     "module": validationObject.module,
    //     "sub_module": validationObject.subModule,
    //     "object": "",
    //     "tcode": "",
    //     "tcode": "",
    //     "type": "transaction"
    //   }

    //   let response =  await getApplicationsApi(params);
    //   if (response.status) {
    //     validationObject.tcode = transactionId;
    //     setTransactionId(response.data);
    //   }
    // }

    const getTcodes = async (object: string) => {
      let params: any = {
        "application_id": validationObject.application,
        "object_type": validationObject.object_type,
        "module": validationObject.module,
        "sub_module": validationObject.sub_module,
        "object": object,
        "tcode": "",
        "type": "tcode"
      }
  
      let response =  await getApplicationsApi(params);
      if (response.status) {
        validationObject.object = object;
        setTcode(response.data);
      }
    }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
      <FormField id="application" label="Application">
        <Select onValueChange={(value: any) => getModules(value)}>
          <SelectTrigger id="application" className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {application.map((app: any) => (
              <SelectItem key={app.value} value={app.value}>{app.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField id="object-type" label="Object Type">
        <Select onValueChange={(value: any) => setValidationObject({ ...validationObject, object_type: value})}>
          <SelectTrigger id="object-type" className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="transaction">Transaction</SelectItem>
            <SelectItem value="program">Program</SelectItem>
            <SelectItem value="interface">Interface</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      <FormField id="module" label="Module">
        <Select onValueChange={(value: any) => getSubModules(value)}>
          <SelectTrigger id="module" className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {module.map((module: any) => (
              <SelectItem key={module.value} value={module.value}>{module.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField id="sub-module" label="Sub Module">
        <Select onValueChange={(value: any) => getObjects(value)}>
          <SelectTrigger id="sub-module" className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {subModule.map((subModule: any) => (
              <SelectItem key={subModule.value} value={subModule.value}>{subModule.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField id="object" label="Object">
        <Select onValueChange={(value: any) => getTcodes(value)}>
          <SelectTrigger id="object" className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Select">Select...</SelectItem>
            {object.map((object: any) => (
              <SelectItem key={object.value} value={object.value}>{object.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      {/* <FormField id="transaction-id" label="Transaction ID">
        <Select onValueChange={(value: any) => getTcodes(value)}>
          <SelectTrigger id="transaction-id" className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {transactionId.map((transactionId: any) => (
              <SelectItem key={transactionId.value} value={transactionId.value}>{transactionId.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField> */}
      <FormField id="tcode" label="Tcode">
        <Select onValueChange={(value: any) => handleApply(value)}>
          <SelectTrigger id="tcode" className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {tcode.map((tcode: any) => (
              <SelectItem key={tcode.value} value={tcode.value}>{tcode.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField id="vc-id" label="VC ID">
        <Input id="vc-id" placeholder="Enter VC ID" value={validationObject.validation_id} onChange={(e) => setValidationObject({ ...validationObject, validation_id: e.target.value })} />
      </FormField>
      <FormField id="vc-description" label="VC Description">
        <Input id="vc-description" placeholder="Enter Description" value={validationObject.validation_description} onChange={(e) => setValidationObject({ ...validationObject, validation_description: e.target.value })} />
      </FormField>
    </div>
  );
};

export default TableConfigurationFilter;