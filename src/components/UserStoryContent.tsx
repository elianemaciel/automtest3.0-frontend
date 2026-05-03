import { Button, CircularProgress } from '@mui/material';
import {
  RadioButton,
  RadioGroup,
  Stack,
  Text3,
  Text5,
} from '@telefonica/mistica';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { v1 as uuidv1 } from 'uuid';
import ValidationErrorSnackbar from './ValidationErrorComponent';
import { API_BASE_URL } from '../config/api';

export default function UserStoryContent(props: {
  setMethods: any;
  showMethodsListContent: any;
  userStory: string;
  setUserStory: any;
}) {
  const {
    setMethods,
    showMethodsListContent,
    userStory: initialUserStory,
    setUserStory: setParentUserStory,
  } = props;
  const [userStory, setUserStory] = useState(initialUserStory);
  const [language, setLanguage] = useState('pt');
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [showValidationError, setShowValidationError] = useState(false);
  const [validationErrorMsg, setValidationErrorMsg] = useState('');

  useEffect(() => {
    setParentUserStory(userStory);
  }, [setParentUserStory, userStory]);

  // const showValidationSnackbar = ValidationErrorSnackbar

  function validateUserStory() {
    const isValid = userStory !== '';

    if (!isValid) {
      setShowValidationError(true);
      setValidationErrorMsg('Please provide a User Story');
      // showValidationSnackbar({open: true, message: validationErrorMsg})
      // <ValidationErrorSnackbar open={true} message={validationErrorMsg} />
    }

    return isValid;
  }

  function generateMethods(story: string, selectedLanguage: string) {
    axios
      .post(
        `${API_BASE_URL}/api/process_user_story`,
        JSON.stringify({ lang: selectedLanguage, userStory: story }),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      .then((response) => {
        const convertedMethods = response.data.map((item: any) => ({
          identifier: uuidv1(),
          name: item.nome,
          className: item.nomeClasse,
          returnType: item.tipoRetorno,
          equivClasses: [],
          parameters: item.parametros.map((p: any) => {
            return { identifier: uuidv1(), name: p.nome, type: p.tipo };
          }),
        }));

        // valida metodos
        // setMethods aqui
        setMethods(convertedMethods);
        setIsLoading(false);
        showMethodsListContent();
        return undefined;
      })
      .catch((error) => {
        // Handle errors
        setIsLoading(false);
        setShowError(true);
        setErrorMessage(
          `${error.code}: ${
            error.response?.data ? error.response.data : error.message
          }`,
        );
        return undefined;
      });
  }

  function renderContent() {
    if (isLoading) {
      return (
        <div
          style={{
            width: '100%',
            height: '560px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <CircularProgress />
        </div>
      );
    }

    if (showError) {
      return (
        <div
          style={{
            width: '100%',
            height: '560px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div style={{ color: 'black' }}>
            A error occurred while requesting AutomTest&apos;s backend:
            <br />
            <br />
            <br />
            <p style={{ color: 'red' }}>{errorMessage}</p>
            <br />
            <br />
            <br />
            <Button
              disableElevation
              variant="outlined"
              style={{ marginLeft: '120px' }}
              onClick={() => setShowError(false)}
            >
              Try again
            </Button>
          </div>
        </div>
      );
    }

    return (
      <Stack space={24}>
        <Text5 color="black">
          Paste below the User Story you want to convert:
        </Text5>
        <textarea
          id="multilineTextInput"
          value={userStory}
          onChange={(event) => {
            setUserStory(event.target.value);
          }}
          rows={24}
          cols={81}
          style={{
            borderRadius: '5px',
            color: 'black',
            fontFamily: 'inherit',
            fontSize: '16px',
            // backgroundColor: '#1b1f24'
            backgroundColor: 'transparent',
          }}
        />
        <div style={{ display: 'flex', margin: '24px', width: '100%' }}>
          <RadioGroup
            name="radio-group"
            onChange={setLanguage}
            defaultValue="pt"
          >
            <div style={{ marginInlineEnd: '24px' }}>
              <RadioButton value="pt">
                <Text3 regular color="black">
                  Português
                </Text3>
              </RadioButton>
            </div>
            <div>
              <RadioButton value="en">
                <Text3 regular color="black">
                  English
                </Text3>
              </RadioButton>
            </div>
          </RadioGroup>
          <div
            style={{
              marginInlineStart: '24px',
              width: '490px',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'flex-end',
              marginInlineEnd: '24px',
            }}
          >
            <Button
              variant="outlined"
              color="primary"
              disableElevation
              style={{
                width: 150,
                // backgroundColor: '#2d516f',
                padding: '10px',
                //     display: 'flex',
                //     justifyContent: 'center',
                //     alignItems: 'center',
                //     minHeight: '80px',
                //     fontWeight: 'bold',
                // color: 'white',
                //    // backgroundColor: buttonState.isCurrentlyActive ? selectedButtonColor : unselectedButtonColor
              }}
              onClick={() => {
                if (validateUserStory()) {
                  setIsLoading(true);
                  generateMethods(userStory, language);
                }
              }}
            >
              Submit Story
            </Button>
          </div>
        </div>
      </Stack>
    );
  }

  return (
    <div style={{ width: '100%', color: 'white' }}>
      <ValidationErrorSnackbar
        open={showValidationError}
        message={validationErrorMsg}
        changeOpenState={() => setShowValidationError(!showValidationError)}
      />
      {renderContent()}
    </div>
  );
}
