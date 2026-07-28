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
      // Create mode — EndpointForm's own buildDefaultValues() fills in
      // every field's default, and isLoading already starts false
      // (useState(isEditMode) above), so there's nothing to do here.
      return;
    }

    let cancelled = false;

    async function loadEndpoint() {
      try {
        // getEndpointById returns the backend's raw sanitized document —
        // authType/apiKeyQueryParam/hmacConfig/oauth2Config/loginConfig
        // all sit at the top level (never nested under `auth`), and no
        // secret value is ever included. EndpointForm's buildDefaultValues
        // reads this shape directly, so it's passed straight through.
        const endpoint = await getEndpointById(id);
        if (cancelled) return;
        setDefaultValues(endpoint);
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
          isEditMode ? 'Manage monitoring parameters for this API.' : 'Register a new API for the platform to monitor.'
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
