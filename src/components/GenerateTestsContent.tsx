/* eslint-disable react/jsx-no-bind */
import { useState } from 'react';
import { Button } from '@mui/material';
import axios from 'axios';
import { Method } from '../models/Method';
import { buildTextField } from './CustomComponents';
import ValidationErrorSnackbar from './ValidationErrorComponent';
import { API_BASE_URL } from '../config/api';

export default function GenerateTestsContent(props: {
  methods: Method[];
  directory: string;
  setDirectory: any;
}) {
  const { methods, directory, setDirectory } = props;
  // const [directory, setDirectory] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [genResult, setGenResult] = useState('');

  function validateAndSendReq() {
    setErrorMsg('');
    setShowError(false);

    if (directory === '') {
      setErrorMsg('Please, paste the directory where to save the files');
      setShowError(true);
      return;
    }

    axios
      .post(
        `${API_BASE_URL}/api/generate_tests`,
        JSON.stringify({ directory, methods }),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      .then(() => {
        setGenResult('Testes gerados com sucesso');
        return undefined;
      })
      .catch(() => {
        setGenResult('An error occurred while generating tests');
        return undefined;
      });
  }

  return (
    <div style={{ fontSize: '20px', textAlign: 'justify', color: 'black' }}>
      <ValidationErrorSnackbar
        open={genResult !== ''}
        message={genResult}
        changeOpenState={() => setGenResult('')}
      />
      Paste the location where to save the test files:
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
          {buildTextField(
            'Directory',
            directory,
            (v: any) => setDirectory(v.target.value),
            false,
            false,
            showError,
            errorMsg,
          )}
        </div>
        <div>
          <Button
            variant="outlined"
            color="success"
            disableElevation
            onClick={validateAndSendReq}
            style={{ height: '55px', marginTop: '0px' }}
          >
            Generate tests
          </Button>
          {showError ? <div style={{ height: '21px' }} /> : <div />}
        </div>
      </div>
    </div>
  );
}
