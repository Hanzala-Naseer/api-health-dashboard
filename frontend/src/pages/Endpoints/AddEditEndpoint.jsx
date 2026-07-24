// import { useEffect, useState } from 'react';
// import { useNavigate, useParams, Link } from 'react-router-dom';
// import toast from 'react-hot-toast';
// import PageHeader from '../../components/layout/PageHeader';
// import Card from '../../components/common/Card';
// import Loader from '../../components/common/Loader';
// import EndpointForm from '../../components/forms/EndpointForm';
// import { createEndpoint, getEndpointById, updateEndpoint } from '../../api/endpointApi';
// import { getErrorMessage } from '../../api/client';

// export default function AddEditEndpoint() {
//   const { id } = useParams();
//   const isEditMode = Boolean(id);
//   const navigate = useNavigate();

//   const [defaultValues, setDefaultValues] = useState(null);
//   const [isLoading, setIsLoading] = useState(isEditMode);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   useEffect(() => {
//     if (!isEditMode) return;
//     let cancelled = false;

//     async function loadEndpoint() {
//       try {
//         const endpoint = await getEndpointById(id);
//         if (cancelled) return;
//         setDefaultValues({
//           name: endpoint.name,
//           url: endpoint.url,
//           method: endpoint.method,
//           expectedStatus: endpoint.expectedStatus,
//           frequency: endpoint.frequency ?? 300,
//           description: endpoint.description ?? '',
//         });
//       } catch (error) {
//         toast.error(getErrorMessage(error, 'Could not load this endpoint.'));
//         navigate('/dashboard/endpoints');
//       } finally {
//         if (!cancelled) setIsLoading(false);
//       }
//     }

//     loadEndpoint();
//     return () => {
//       cancelled = true;
//     };
//   }, [id, isEditMode, navigate]);

//   async function handleSubmit(values) {
//     setIsSubmitting(true);
//     try {
//       if (isEditMode) {
//         await updateEndpoint(id, values);
//         toast.success('Endpoint updated successfully.');
//         navigate(`/dashboard/endpoints/${id}`);
//       } else {
//         const endpoint = await createEndpoint(values);
//         toast.success('Endpoint created successfully.');
//         navigate(`/dashboard/endpoints/${endpoint.id}`);
//       }
//     } catch (error) {
//       toast.error(getErrorMessage(error, 'Could not save this endpoint.'));
//     } finally {
//       setIsSubmitting(false);
//     }
//   }

//   if (isLoading) {
//     return <Loader label="Loading endpoint..." fullHeight />;
//   }

//   return (
//     <div className="mx-auto max-w-2xl">
//       <PageHeader
//         eyebrow={isEditMode ? 'Endpoints / Edit' : 'Endpoints / New'}
//         title={isEditMode ? 'Configuration Settings' : 'Add New Endpoint'}
//         description={
//           isEditMode
//             ? 'Manage monitoring parameters for this API.'
//             : 'Register a new API for the platform to monitor.'
//         }
//       />
//       <Card>
//         <EndpointForm
//           defaultValues={defaultValues ?? undefined}
//           onSubmit={handleSubmit}
//           onCancel={() => navigate(-1)}
//           isSubmitting={isSubmitting}
//           submitLabel={isEditMode ? 'Save Endpoint' : 'Create Endpoint'}
//           allowFrequency={isEditMode}
//         />
//       </Card>
//       {!isEditMode && (
//         <p className="mt-4 text-center text-sm text-text-secondary">
//           <Link to="/dashboard/endpoints" className="text-primary hover:underline">
//             Back to Endpoints
//           </Link>
//         </p>
//       )}
//     </div>
//   );
// }


import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import EndpointForm from '../../components/forms/EndpointForm';
import { createEndpoint, getEndpointById, updateEndpoint } from '../../api/endpointApi';
import { getErrorMessage } from '../../api/client';

export default function AddEditEndpoint() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [defaultValues, setDefaultValues] = useState(null);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditMode) {
      // Create mode — set default values with auth
      setDefaultValues({
        name: '',
        url: '',
        method: 'GET',
        expectedStatus: 200,
        frequency: 300,
        description: '',
        auth: {
          type: 'NONE',
          staticToken: '',
          apiKeyHeader: '',
          apiKeyValue: '',
          basicUsername: '',
          basicPassword: '',
          loginConfig: {
            loginUrl: 'http://localhost:5001/api/health-demo/items/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'demo@pulseops.app',
              password: 'DemoPassword123!',
            }, null, 2),
            tokenPath: 'data.accessToken',
            asBearer: true,
            cacheTtlSeconds: 0,
          },
        },
      });
      setIsLoading(false);
      return;
    }

    let cancelled = false;

  async function loadEndpoint() {
  try {
    const endpoint = await getEndpointById(id);
    if (cancelled) return;

    console.log('📦 Loaded endpoint data:', endpoint);

    // Build auth object from flat fields
    let auth = {
      type: endpoint.authType || 'NONE',
      staticToken: '',
      apiKeyHeader: '',
      apiKeyValue: '',
      basicUsername: '',
      basicPassword: '',
      loginConfig: {
        loginUrl: '',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '',
        tokenPath: 'data.accessToken',
        asBearer: true,
        cacheTtlSeconds: 0,
      },
    };

    // If there's a loginConfig, merge it
    if (endpoint.loginConfig) {
      // ⭐ Convert body to JSON string for the textarea
      let bodyValue = '';
      
      console.log('🔍 loginConfig.body raw value:', endpoint.loginConfig.body);

      if (endpoint.loginConfig.body) {
        if (typeof endpoint.loginConfig.body === 'object') {
          bodyValue = JSON.stringify(endpoint.loginConfig.body, null, 2);
        } else if (typeof endpoint.loginConfig.body === 'string') {
          try {
            const parsed = JSON.parse(endpoint.loginConfig.body);
            bodyValue = JSON.stringify(parsed, null, 2);
          } catch {
            bodyValue = endpoint.loginConfig.body;
          }
        }
      } else if (endpoint.authType === 'LOGIN_FLOW') {
        // ⭐ FALLBACK: Pre-fill with demo credentials if body is missing
        console.log('⚠️ Body is missing, using fallback demo credentials');
        bodyValue = JSON.stringify({
          email: 'demo@pulseops.app',
          password: 'DemoPassword123!',
        }, null, 2);
      }

      auth.loginConfig = {
        loginUrl: endpoint.loginConfig.loginUrl || '',
        method: endpoint.loginConfig.method || 'POST',
        headers: endpoint.loginConfig.headers || { 'Content-Type': 'application/json' },
        body: bodyValue, // ⭐ This is now a string for the textarea
        tokenPath: endpoint.loginConfig.tokenPath || 'data.accessToken',
        asBearer: endpoint.loginConfig.asBearer !== false,
        cacheTtlSeconds: endpoint.loginConfig.cacheTtlSeconds || 0,
      };
    }

    // Build the complete default values
    const defaults = {
      name: endpoint.name || '',
      url: endpoint.url || '',
      method: endpoint.method || 'GET',
      expectedStatus: endpoint.expectedStatus || 200,
      frequency: endpoint.frequency ?? 300,
      description: endpoint.description ?? '',
      auth: auth,
    };


    if (cancelled) return;
    setDefaultValues(defaults);
  } catch (error) {
    toast.error(getErrorMessage(error, 'Could not load this endpoint.'));
    navigate('/dashboard/endpoints');
  } finally {
    if (!cancelled) setIsLoading(false);
  }
}

    loadEndpoint();
    return () => {
      cancelled = true;
    };
  }, [id, isEditMode, navigate]);

  async function handleSubmit(values) {
    setIsSubmitting(true);
    try {
      console.log('📤 Submitting values:', values);
      if (isEditMode) {
        await updateEndpoint(id, values);
        toast.success('Endpoint updated successfully.');
        navigate(`/dashboard/endpoints/${id}`);
      } else {
        const endpoint = await createEndpoint(values);
        toast.success('Endpoint created successfully.');
        navigate(`/dashboard/endpoints/${endpoint.id}`);
      }
    } catch (error) {
      console.error('❌ Submit error:', error);
      toast.error(getErrorMessage(error, 'Could not save this endpoint.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <Loader label="Loading endpoint..." fullHeight />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow={isEditMode ? 'Endpoints / Edit' : 'Endpoints / New'}
        title={isEditMode ? 'Configuration Settings' : 'Add New Endpoint'}
        description={
          isEditMode
            ? 'Manage monitoring parameters for this API.'
            : 'Register a new API for the platform to monitor.'
        }
      />
      <Card>
        <EndpointForm
          defaultValues={defaultValues ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => navigate(-1)}
          isSubmitting={isSubmitting}
          submitLabel={isEditMode ? 'Save Endpoint' : 'Create Endpoint'}
          allowFrequency={isEditMode}
        />
      </Card>
      {!isEditMode && (
        <p className="mt-4 text-center text-sm text-text-secondary">
          <Link to="/dashboard/endpoints" className="text-primary hover:underline">
            Back to Endpoints
          </Link>
        </p>
      )}
    </div>
  );
}