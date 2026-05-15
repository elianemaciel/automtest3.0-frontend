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
  const [aiResult, setAiResult] = useState('');
  const [isGeneratingFile, setIsGeneratingFile] = useState(false);
  const [isGeneratingWithAI, setIsGeneratingWithAI] = useState(false);

  function downloadGeneratedFile(response: any) {
    const contentDisposition = response.headers['content-disposition'] || '';
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    const filename = filenameMatch?.[1] || 'AutomTestGeneratedTests.zip';
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');

    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
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
      .then((response) => {
        downloadGeneratedFile(response);
        setGenResult('Arquivo de testes gerado com sucesso');
        return undefined;
      })
      .catch((error) => {
        setGenResult(
          `An error occurred while generating tests: ${error.message}`,
        );
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
    setAiResult('');

    if (methods.length === 0) {
      setGenResult('No methods available to generate tests');
      return;
    }

    setIsGeneratingWithAI(true);

    // eslint-disable-next-line promise/catch-or-return
    axios
      .post(
        `${API_BASE_URL}/api/generate_tests_llm`,
        JSON.stringify({
          lang: 'pt',
          methods,
          selectedIA,
          targetLanguage: 'java',
        }),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      .then((response) => {
        setAiResult(JSON.stringify(response.data, null, 2));
        setGenResult('Testes gerados com IA com sucesso');
        return undefined;
      })
      .catch((error) => {
        const message = error.response?.data?.error || error.message;
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
      {aiResult !== '' ? (
        <pre
          style={{
            width: '690px',
            maxHeight: '220px',
            overflow: 'auto',
            marginTop: '24px',
            padding: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '5px',
            backgroundColor: '#f8fafc',
            color: 'black',
            fontSize: '12px',
            whiteSpace: 'pre-wrap',
          }}
        >
          {aiResult}
        </pre>
      ) : (
        <div />
      )}
    </div>
  );
}
