/* eslint-disable */
import { Button, CircularProgress } from '@mui/material';
import {
  RadioButton,
  RadioGroup,
  Stack,
  Text3,
  Text1,
  Text5,
  Text2,
} from '@telefonica/mistica';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { v1 as uuidv1 } from 'uuid';
import ValidationErrorSnackbar from './ValidationErrorComponent';

export default function UserStoryContent(props: {
  setMethods: any;
  showMethodsListContent: any;
  userStory: string;
  setUserStory: any;
}) {
  const [userStory, setUserStory] = useState(props.userStory);
  const [language, setLanguage] = useState('pt');
  const [selectedIA, setSelectedIA] = useState('gemini');
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [showValidationError, setShowValidationError] = useState(false);
  const [validationErrorMsg, setValidationErrorMsg] = useState('');

  useEffect(() => {
    props.setUserStory(userStory);
  }, [userStory]);

  // const showValidationSnackbar = ValidationErrorSnackbar

  function validateUserStory() {
    const isValid = userStory != '';

    if (!isValid) {
      setShowValidationError(true);
      setValidationErrorMsg('Please provide a User Story');
      // showValidationSnackbar({open: true, message: validationErrorMsg})
      // <ValidationErrorSnackbar open={true} message={validationErrorMsg} />
    }

    return isValid;
  }

  function generateMethods(userStory: string, language: string) {
  console.log('Generating methods...');

  axios
    .post('http://127.0.0.1:5000/api/process_user_story', {
      lang: language,
      userStory,
      selectedIA,
    })
    .then((response) => {
      console.log('response=', response.data);

      const convertedMethods = response.data.map((item: any) => ({
        identifier: uuidv1(),
        name: item.nome,
        className: item.nomeClasse,
        returnType: item.tipoRetorno,
        equivClasses: [],
        parameters: item.parametros.map((p: any) => ({
          identifier: uuidv1(),
          name: p.nome,
          type: p.tipo,
        })),
      }));

      props.setMethods(convertedMethods);
      setIsLoading(false);
      props.showMethodsListContent();
    })
    .catch((error) => {
      setIsLoading(false);
      setShowError(true);
      setErrorMessage(
        `${error.code}: ${
          error.response?.data ? error.response.data : error.message
        }`,
      );
      console.error('Error fetching data:', error);
    });
}


  return (
    <div style={{ width: '100%', color: 'white' }}>
      <ValidationErrorSnackbar
        open={showValidationError}
        message={validationErrorMsg}
        changeOpenState={() => setShowValidationError(!showValidationError)}
      />

      {isLoading ? (
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
      ) : showError ? (
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
            A error occurred while requesting AutomTest's backend:
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
      ) : (
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
                  <Text2 regular color="black">
                    Português
                  </Text2>
                </RadioButton>
              </div>
              <div>
                <RadioButton value="en">
                  <Text2 regular color="black">
                    English
                  </Text2>
                </RadioButton>
              </div>
            </RadioGroup>

            <div
              style={{
                marginInlineStart: '24px',
                width: '490px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginInlineEnd: '24px',
              }}
            >
              <RadioGroup
                name="radio-ia"
                onChange={setSelectedIA}
                defaultValue="gemini"
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, auto)',
                    columnGap: '8px',
                    rowGap: '8px',
                    alignItems: 'center',
                    marginBottom: '14px',
                  }}
                >
                  <RadioButton value="gemini">
                    <Text1 regular color="black">
                      Gemini
                    </Text1>
                  </RadioButton>
                  <RadioButton value="gpt">
                    <Text1 regular color="black">
                      ChatGPT
                    </Text1>
                  </RadioButton>
                  <RadioButton value="llama">
                    <Text1 regular color="black">
                      LLaMA
                    </Text1>
                  </RadioButton>
                  <RadioButton value="deepseek">
                    <Text1 regular color="black">
                      DeepSeek
                    </Text1>
                  </RadioButton>
                  <RadioButton value="groq">
                    <Text1 regular color="black">
                      Groq
                    </Text1>
                  </RadioButton>
                </div>
              </RadioGroup>

              <Button
                variant="outlined"
                color="primary"
                disableElevation
                style={{
                  width: 80,
                  // backgroundColor: '#2d516f',
                  padding: '10px',
                  marginBottom: '0px',
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
                  } else {
                    // alert("Pr");
                  }
                }}
              >
                Submit Story
              </Button>
            </div>
          </div>
        </Stack>
      )}
    </div>
  );
}
