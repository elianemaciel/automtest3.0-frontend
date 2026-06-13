/* eslint-disable react/jsx-no-bind */
import { useState } from 'react';
import { Button } from '@mui/material';
import axios from 'axios';
import { Method } from '../models/Method';
import ValidationErrorSnackbar from './ValidationErrorComponent';
import { API_BASE_URL } from '../config/api';

export default function GenerateTestsContent(props: {
  methods: Method[];
  selectedIA: string;
}) {
  const { methods, selectedIA } = props;
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [genResult, setGenResult] = useState('');
  const [isGeneratingFile, setIsGeneratingFile] = useState(false);
  const [isGeneratingWithAI, setIsGeneratingWithAI] = useState(false);

  async function saveGeneratedFile(response: any) {
    const contentDisposition = response.headers['content-disposition'] || '';
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    const filename = filenameMatch?.[1] || 'AutomTestGeneratedTests.zip';
    const blob =
      response.data instanceof Blob ? response.data : new Blob([response.data]);

    if (window.electron?.saveGeneratedFile) {
      const result = await window.electron.saveGeneratedFile({
        filename,
        data: await blob.arrayBuffer(),
      });

      return !result.canceled;
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return true;
  }

  async function getRequestErrorMessage(error: any) {
    if (error.response?.data instanceof Blob) {
      const text = await error.response.data.text();

      try {
        return JSON.parse(text).error || text;
      } catch {
        return text || error.message;
      }
    }

    return error.response?.data?.error || error.message;
  }

  function validateAndSendReq() {
    setErrorMsg('');
    setShowError(false);
    setGenResult('');

    if (methods.length === 0) {
      setErrorMsg('No methods available to generate tests');
      setShowError(true);
      return;
    }

    setIsGeneratingFile(true);

    // eslint-disable-next-line promise/catch-or-return
    axios
      .post(`${API_BASE_URL}/api/generate_tests`, JSON.stringify({ methods }), {
        headers: {
          'Content-Type': 'application/json',
        },
        responseType: 'blob',
      })
      .then(async (response) => {
        const saved = await saveGeneratedFile(response);
        setGenResult(
          saved
            ? 'Arquivo de testes gerado com sucesso'
            : 'Geração cancelada pelo usuário',
        );
        return undefined;
      })
      .catch(async (error) => {
        const message = await getRequestErrorMessage(error);
        setGenResult(`An error occurred while generating tests: ${message}`);
        return undefined;
      })
      .finally(() => {
        setIsGeneratingFile(false);
      });
  }

  function generateTestsWithAI() {
    setErrorMsg('');
    setShowError(false);
    setGenResult('');

    if (methods.length === 0) {
      setGenResult('No methods available to generate tests');
      return;
    }

    const methodsWithEquivalenceClasses = methods.map((method) => ({
      ...method,
      equivClasses: method.equivClasses || [],
    }));
    const equivalenceClasses = methodsWithEquivalenceClasses.flatMap((method) => {
  if (!method.equivClasses.length) {
    return [{
      methodIdentifier: method.identifier,
      methodName: method.name,
      equivalenceClass: null,
    }];
  }

  return method.equivClasses.map((equivClass) => ({
    ...equivClass,
    methodIdentifier: method.identifier,
    methodName: method.name,
  }));
});

    if (equivalenceClasses.length === 0) {
      setGenResult('Please provide at least one Equivalence Class');
      return;
    }

    setIsGeneratingWithAI(true);

    // eslint-disable-next-line promise/catch-or-return
    axios
      .post(
        `${API_BASE_URL}/api/generate_tests_llm`,
        JSON.stringify({
          lang: 'pt',
          methods: methodsWithEquivalenceClasses,
          equivalenceClasses,
          selectedIA,
          targetLanguage: 'java',
        }),
        {
          headers: {
            'Content-Type': 'application/json',
          },
          responseType: 'blob',
        },
      )
      .then(async (response) => {
        const saved = await saveGeneratedFile(response);
        setGenResult(
          saved
            ? 'Arquivo de testes gerado com IA com sucesso'
            : 'Geração cancelada pelo usuário',
        );
        return undefined;
      })
      .catch(async (error) => {
        const message = await getRequestErrorMessage(error);
        setGenResult(
          `An error occurred while generating tests with AI: ${message}`,
        );
        return undefined;
      })
      .finally(() => {
        setIsGeneratingWithAI(false);
      });
  }

  return (
    <div style={{ fontSize: '20px', textAlign: 'justify', color: 'black' }}>
      <ValidationErrorSnackbar
        open={genResult !== ''}
        message={genResult}
        changeOpenState={() => setGenResult('')}
      />
      Generate test files from the selected methods and equivalence classes:
      <div
        style={{
          paddingRight: '0px',
          paddingTop: '215px',
          display: 'flex',
          width: '690px',
          alignItems: 'center',
          borderRadius: '5px',
        }}
      >
        <div style={{ marginTop: '12px', marginRight: '16px', width: '100%' }}>
          {showError ? <div style={{ color: 'red' }}>{errorMsg}</div> : <div />}
        </div>
        <div>
          <Button
            variant="outlined"
            color="success"
            disableElevation
            onClick={validateAndSendReq}
            disabled={isGeneratingFile}
            style={{ height: '55px', marginTop: '0px' }}
          >
            {isGeneratingFile ? 'Generating...' : 'Generate tests'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            disableElevation
            onClick={generateTestsWithAI}
            disabled={isGeneratingWithAI}
            style={{ height: '55px', marginTop: '12px' }}
          >
            {isGeneratingWithAI ? 'Generating...' : 'Generate with AI'}
          </Button>
          {showError ? <div style={{ height: '21px' }} /> : <div />}
        </div>
      </div>
    </div>
  );
}
