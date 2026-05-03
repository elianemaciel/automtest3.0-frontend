/* eslint-disable react/jsx-no-bind, react/require-default-props */
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';

import { Text5 } from '@telefonica/mistica';
import { useEffect, useState } from 'react';
import { v1 as uuidv1 } from 'uuid';
import axios from 'axios';
import { buildTextField } from '../CustomComponents';
import { Method } from '../../models/Method';
import { EquivalenceClass } from '../../models/EquivalenceClass';
import { DataRange } from '../../models/DataRange';
import {
  BooleanRangeComponent,
  CharRangeComponent,
  DateRangeComponent,
  NumberRangeComponent,
} from './RangeComponents';
import ParametersRange from './ParametersRange';
import { StringRangeComponent } from './range/StringRange';
import ValidationErrorSnackbar from '../ValidationErrorComponent';
import { StringRangePieceType } from '../../models/StringDataRange';
import { API_BASE_URL } from '../../config/api';

type AiEquivalenceClass = {
  type?: string;
  range?: string;
};

type AiEquivalenceAttribute = {
  attribute?: string;
  classes?: AiEquivalenceClass[];
};

export default function EquivClassCreateOrUpdate(props: {
  methodsAvaliable: Method[];
  isCreate: boolean;
  setMethods: any;
  showEquivClassList: any;
  methodIndex?: number | undefined;
  equivClass?: EquivalenceClass | undefined;
}) {
  const {
    methodsAvaliable,
    isCreate,
    setMethods,
    showEquivClassList,
    methodIndex,
    equivClass,
  } = props;

  const [currentMethod, setCurrentMethod] = useState(
    methodsAvaliable[methodIndex || 0],
  );
  const [currentMethodParams, setCurrentMethodParams] = useState(
    currentMethod.parameters,
  );

  const [selectedMethodName, setSelectedMethodName] = useState(
    currentMethod.name,
  );
  const [equivClassName, setEquivClassName] = useState(
    equivClass ? equivClass.name : '',
  );
  const [numberOfCases, setNumberOfCases] = useState(
    equivClass ? `${equivClass.numberOfCases}` : '',
  );
  // const [returnValue, setReturnValue] = useState<DataRange>({v1: '[numbers][abc123]', v2: '[1~2][3~4]', v3: ''})
  const [returnValue, setReturnValue] = useState<DataRange>(
    equivClass ? equivClass.expectedOutputRange : { v1: '', v2: '', v3: '' },
  );
  const [paramsDataRange, setParamsDataRange] = useState<DataRange[]>(
    equivClass
      ? equivClass.acceptableParamRanges
      : currentMethod.parameters.map((p) => {
          return { param_id: p.identifier, v1: '', v2: '', v3: '' };
        }),
  );

  const [showValidationError, setShowValidationError] = useState(false);
  const [validationErrorMsg, setValidationErrorMsg] = useState('');
  const [isGeneratingWithAi, setIsGeneratingWithAi] = useState(false);

  useEffect(() => {
    setCurrentMethodParams(currentMethod.parameters);
    if (!equivClass) {
      setParamsDataRange(
        currentMethod.parameters.map((p) => {
          return { param_id: p.identifier, v1: '', v2: '', v3: '' };
        }),
      );
    }
  }, [currentMethod, equivClass]);

  function getMethodsFromMethodList() {
    return methodsAvaliable.map((m) => {
      return { value: m.name, text: m.name };
    });
  }

  function sanitizeEquivClassName(value: string) {
    const sanitized = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^([^a-zA-Z_])/, '_$1');

    return sanitized && /^[a-zA-Z_]/.test(sanitized)
      ? sanitized
      : 'ai_equivalence_class';
  }

  function extractJsonFromAiResponse(
    responseData: any,
  ): AiEquivalenceAttribute[] {
    let rawData = '';

    if (typeof responseData === 'string') {
      rawData = responseData;
    } else if (typeof responseData === 'object' && responseData !== null) {
      rawData = JSON.stringify(responseData);
    }

    const jsonText = rawData
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const parsed = JSON.parse(jsonText);

    return Array.isArray(parsed) ? parsed : [];
  }

  function getFirstGeneratedClass(attribute?: AiEquivalenceAttribute) {
    if (!attribute?.classes || attribute.classes.length === 0) return undefined;

    return (
      attribute.classes.find((c) => c.type?.toLowerCase() === 'valid') ||
      attribute.classes[0]
    );
  }

  function parseRangeNumbers(range: string) {
    return range.match(/-?\d+(\.\d+)?/g) || [];
  }

  function formatGeneratedRangeByType(
    range: string,
    type?: string,
    paramId?: string,
  ): DataRange {
    const normalizedType = (type || '').toLowerCase();

    if (normalizedType === 'boolean') {
      const lowerRange = range.toLowerCase();
      return {
        param_id: paramId,
        v1: lowerRange.includes('false') ? 'false' : 'true',
        v2: '',
        v3: '',
      };
    }

    if (normalizedType === 'char') {
      return {
        param_id: paramId,
        v1: range
          .split(/[;,]/)
          .map((v) => v.trim())
          .filter((v) => v !== '')
          .map((v) => v[0])
          .join(';'),
        v2: '',
        v3: '',
      };
    }

    if (
      normalizedType === 'int' ||
      normalizedType === 'double' ||
      normalizedType === 'float'
    ) {
      const numbers = parseRangeNumbers(range);
      return {
        param_id: paramId,
        v1: numbers[0] || '',
        v2: numbers[1] || numbers[0] || '',
        v3: numbers.slice(2).join(';'),
      };
    }

    if (normalizedType === 'string') {
      const cleanedRange = range.replace(/[[\]]/g, '').trim() || 'text';
      return {
        param_id: paramId,
        v1: `[${cleanedRange}]`,
        v2: `[1~${Math.max(cleanedRange.length, 1)}]`,
        v3: '',
      };
    }

    return {
      param_id: paramId,
      v1: range,
      v2: '',
      v3: '',
    };
  }

  function applyAiGeneratedClasses(
    generatedAttributes: AiEquivalenceAttribute[],
  ) {
    const generatedRanges = currentMethod.parameters.map((param) => {
      const generatedAttribute = generatedAttributes.find(
        (attribute) => attribute.attribute === param.name,
      );
      const generatedClass = getFirstGeneratedClass(generatedAttribute);

      if (!generatedClass?.range) {
        return { param_id: param.identifier, v1: '', v2: '', v3: '' };
      }

      return formatGeneratedRangeByType(
        generatedClass.range,
        param.type,
        param.identifier,
      );
    });

    setParamsDataRange(generatedRanges);

    if (!equivClassName) {
      setEquivClassName(
        sanitizeEquivClassName(`${currentMethod.name}_ai_equivalence_class`),
      );
    }

    if (!numberOfCases) {
      setNumberOfCases('1');
    }
  }

  function generateEquivClassWithAi() {
    setIsGeneratingWithAi(true);

    return axios
      .post(
        `${API_BASE_URL}/api/process_class_equivalence`,
        JSON.stringify({
          lang: 'pt',
          selectedIA: 'gpt',
          methods: [currentMethod],
        }),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      .then((response) => {
        const generatedAttributes = extractJsonFromAiResponse(response.data);

        if (generatedAttributes.length === 0) {
          setShowValidationError(true);
          setValidationErrorMsg('No equivalence classes were generated by AI');
          return undefined;
        }

        applyAiGeneratedClasses(generatedAttributes);
        return undefined;
      })
      .catch((error) => {
        setShowValidationError(true);
        setValidationErrorMsg(
          `${error.code}: ${
            error.response?.data?.error || error.response?.data || error.message
          }`,
        );
        return undefined;
      })
      .finally(() => {
        setIsGeneratingWithAi(false);
      });
  }

  function removeElementByIndex(input: string, index: number): string {
    const elements = input.match(/\[[^\]]*\]/g);

    if (!elements || index < 0 || index >= elements.length) {
      return input;
    }

    elements.splice(index, 1);
    return elements.join('');
  }

  function showReturnComponent() {
    if (currentMethod.returnType.toLowerCase() === 'boolean') {
      return (
        <BooleanRangeComponent range={returnValue} setRange={setReturnValue} />
      );
    }
    if (currentMethod.returnType.toLowerCase() === 'char') {
      return (
        <CharRangeComponent range={returnValue} setRange={setReturnValue} />
      );
    }
    if (currentMethod.returnType.toLowerCase() === 'date') {
      return (
        <DateRangeComponent range={returnValue} setRange={setReturnValue} />
      );
    }
    if (currentMethod.returnType.toLowerCase() === 'string') {
      return (
        <StringRangeComponent
          range={returnValue}
          setRange={setReturnValue}
          addEmptyStringRange={() =>
            setReturnValue({
              ...returnValue,
              v1: `${returnValue.v1}[]`,
              v2: `${returnValue.v2}[]`,
            })
          }
          onRemove={(index: number) =>
            setReturnValue({
              ...returnValue,
              v1: removeElementByIndex(returnValue.v1, index),
              v2: removeElementByIndex(returnValue.v2, index),
            })
          }
        />
      );
    }
    if (
      currentMethod.returnType.toLowerCase() === 'double' ||
      currentMethod.returnType.toLowerCase() === 'float' ||
      currentMethod.returnType.toLowerCase() === 'int'
    ) {
      return (
        <NumberRangeComponent
          type={currentMethod.returnType.toUpperCase()}
          range={returnValue}
          setRange={setReturnValue}
        />
      );
    }
    return <div />;
  }

  function validateString(range: DataRange) {
    if (!range.v1) return false;

    const content =
      range.v1.length > 2 ? range.v1.slice(1, -1).split('][') : [];
    const quantity =
      range.v2.length > 2 ? range.v2.slice(1, -1).split('][') : [];

    if (content.length === 0 || content.length !== quantity.length) {
      return false;
    }

    for (let i = 0; i < content.length; i += 1) {
      const contentPiece = content[i];
      const quantityPiece = quantity[i];

      const type: any = StringRangePieceType.some(
        (t) => t.value === contentPiece,
      )
        ? StringRangePieceType.find((t) => t.value === contentPiece)
        : StringRangePieceType.find((t) => t.value === 'manually_specify');
      const contentValue =
        type?.value === 'manually_specify' ? contentPiece : '';
      const from = quantityPiece.split('~')[0];
      const to = quantityPiece.split('~')[1];

      if (
        (type?.value === 'manually_specify' && contentValue === '') ||
        !type ||
        type.value === '' ||
        from === '' ||
        to === '' ||
        !/^[0-9]+$/.test(from) ||
        parseInt(from, 10) <= 0 ||
        !/^[0-9]+$/.test(to) ||
        parseInt(to, 10) <= 0 ||
        parseInt(to, 10) < parseInt(from, 10)
      ) {
        return false;
      }
    }
    return true;
  }

  function validateParameters() {
    for (let i = 0; i < paramsDataRange.length; i += 1) {
      const paramDataRange = paramsDataRange[i];
      const param = currentMethod.parameters.find(
        (p) => p.identifier === paramDataRange.param_id,
      );
      const type = param?.type;
      const paramName = param?.name;
      if (
        type === 'boolean' &&
        !(
          paramDataRange.v1.toLowerCase() === 'true' ||
          paramDataRange.v1.toLowerCase() === 'false'
        )
      ) {
        setShowValidationError(true);
        setValidationErrorMsg(`Please provide valid parameter "${paramName}"`);
        return false;
      }
      if (type === 'char' && !/^(.(;.)*)$/.test(paramDataRange.v1)) {
        setShowValidationError(true);
        setValidationErrorMsg(`Please provide valid parameter "${paramName}"`);
        return false;
      }
      if (
        type === 'date' &&
        !(
          /^[0-9]{2}-[0-9]{2}-[0-9]{4}$/.test(paramDataRange.v1) &&
          /^[0-9]{2}-[0-9]{2}-[0-9]{4}$/.test(paramDataRange.v2) &&
          /^([0-9]{2}-[0-9]{2}-[0-9]{4})*$/.test(paramDataRange.v3)
        )
      ) {
        setShowValidationError(true);
        setValidationErrorMsg(`Please provide valid parameter "${paramName}"`);
        return false;
      }
      if (
        (type === 'double' || type === 'float') &&
        !(
          /^[0-9]+(\.[0-9]+){0,1}$/.test(paramDataRange.v1) &&
          /^[0-9]+(\.[0-9]+){0,1}$/.test(paramDataRange.v2) &&
          /^[0-9]+(\.[0-9]+){0,1}|(([0-9]+(\.[0-9]+){0,1}){0,1}(;[0-9]+(\.[0-9]+){0,1})*)$/.test(
            paramDataRange.v3,
          ) &&
          parseFloat(paramDataRange.v1) <= parseFloat(paramDataRange.v2)
        )
      ) {
        setShowValidationError(true);
        setValidationErrorMsg(`Please provide valid parameter "${paramName}"`);
        return false;
      }
      if (
        type === 'int' &&
        !(
          /^[0-9]+$/.test(paramDataRange.v1) &&
          /^[0-9]+$/.test(paramDataRange.v2) &&
          /^([0-9]+(;[0-9]+)*){0,1}$/.test(paramDataRange.v3) &&
          parseInt(paramDataRange.v1, 10) <= parseInt(paramDataRange.v2, 10)
        )
      ) {
        setShowValidationError(true);
        setValidationErrorMsg(`Please provide valid parameter "${paramName}"`);
        return false;
      }
      if (type === 'string' && !validateString(paramDataRange)) {
        setShowValidationError(true);
        setValidationErrorMsg(`Please provide valid parameter "${paramName}"`);
        return false;
      }
    }
    return true;
  }

  return (
    <div>
      <ValidationErrorSnackbar
        open={showValidationError}
        message={validationErrorMsg}
        changeOpenState={() => setShowValidationError(!showValidationError)}
      />
      <Box
        sx={{
          height: 500,
          overflow: 'auto',
          paddingRight: '16px',
        }}
      >
        <Text5 color="black">
          {isCreate
            ? 'Choose a method and specify an Equivalence Class for it:'
            : 'Edit the Equivalence Class for the method:'}
        </Text5>
        <FormControl fullWidth style={{ marginTop: '24px' }}>
          <FormControl fullWidth style={{ marginBottom: '12px' }}>
            <InputLabel id="demo-simple-select-label">
              Method related to this Equivalence Class*
            </InputLabel>
            <Select
              id="outlined-basic"
              variant="outlined"
              value={selectedMethodName}
              disabled={!isCreate}
              label="Method related to this Equivalence Class*"
              // onChange={val => setSelectedMethodName(val.target.value)}>
              onChange={(val) => {
                const method = methodsAvaliable.find(
                  (m) => m.name === val.target.value,
                );
                if (method) {
                  setSelectedMethodName(val.target.value);
                  setCurrentMethod(method);
                }
              }}
            >
              {getMethodsFromMethodList().map((v) => (
                <MenuItem value={v.value}>{v.text}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {buildTextField('Equivalence class name*', equivClassName, (v: any) =>
            setEquivClassName(v.target.value),
          )}
          {buildTextField(
            'Number of test cases to be generated (for each parameter)*',
            `${numberOfCases}`,
            (v: any) => setNumberOfCases(v.target.value),
          )}
          {isCreate ? (
            <Button
              variant="outlined"
              color="info"
              disableElevation
              fullWidth
              disabled={isGeneratingWithAi}
              style={{ height: '55px', marginBottom: '12px' }}
              onClick={generateEquivClassWithAi}
            >
              {isGeneratingWithAi ? (
                <CircularProgress size={24} />
              ) : (
                'Generate parameter ranges with AI'
              )}
            </Button>
          ) : null}
          {showReturnComponent()}

          <ParametersRange
            parameters={currentMethodParams}
            paramsDataRange={paramsDataRange}
            setParamsDataRange={setParamsDataRange}
          />
        </FormControl>
      </Box>
      <Grid container justifyContent="flex-end" spacing={1} marginTop={1}>
        <Grid item xs={2}>
          <Button
            variant="outlined"
            color="secondary"
            disableElevation
            fullWidth
            style={{ height: '55px' }}
            onClick={() => showEquivClassList()}
          >
            Go back
          </Button>
        </Grid>
        <Grid item xs={2}>
          <Button
            variant="outlined"
            color="primary"
            disableElevation
            fullWidth
            style={{ height: '55px' }}
            onClick={() => {
              if (!/^[a-zA-Z_][a-zA-Z0-9_]+$/.test(equivClassName)) {
                setShowValidationError(true);
                setValidationErrorMsg('Please provide a valid class name');
              } else if (
                !/^[0-9]+$/.test(numberOfCases) ||
                parseInt(numberOfCases, 10) <= 0
              ) {
                setShowValidationError(true);
                setValidationErrorMsg(
                  'Please provide a valid number of test cases to be generated',
                );
              } else if (
                currentMethod.returnType.toLowerCase() === 'boolean' &&
                !(
                  returnValue.v1.toLowerCase() === 'true' ||
                  returnValue.v1.toLowerCase() === 'false'
                )
              ) {
                setShowValidationError(true);
                setValidationErrorMsg('Please provide a valid return');
              } else if (
                currentMethod.returnType.toLowerCase() === 'char' &&
                !/^(.(;.)*)$/.test(returnValue.v1)
              ) {
                setShowValidationError(true);
                setValidationErrorMsg('Please provide a valid return');
              } else if (
                currentMethod.returnType.toLowerCase() === 'date' &&
                !(
                  /^[0-9]{2}-[0-9]{2}-[0-9]{4}$/.test(returnValue.v1) &&
                  /^[0-9]{2}-[0-9]{2}-[0-9]{4}$/.test(returnValue.v2) &&
                  /^([0-9]{2}-[0-9]{2}-[0-9]{4})*$/.test(returnValue.v3)
                )
              ) {
                setShowValidationError(true);
                setValidationErrorMsg('Please provide a valid return');
              } else if (
                (currentMethod.returnType.toLowerCase() === 'double' ||
                  currentMethod.returnType.toLowerCase() === 'float') &&
                !(
                  /^(-){0,1}[0-9]+(\.[0-9]+){0,1}$/.test(returnValue.v1) &&
                  /^(-){0,1}[0-9]+(\.[0-9]+){0,1}$/.test(returnValue.v2) &&
                  /^((-){0,1}[0-9]+(\.[0-9]+){0,1}(;(-){0,1}[0-9]+(\.[0-9]+){0,1})*){0,1}$/.test(
                    returnValue.v3,
                  ) &&
                  parseFloat(returnValue.v1) <= parseFloat(returnValue.v2)
                )
              ) {
                setShowValidationError(true);
                setValidationErrorMsg('Please provide a valid return');
              } else if (
                currentMethod.returnType.toLowerCase().includes('int') &&
                !(
                  /^(-){0,1}[0-9]+$/.test(returnValue.v1) &&
                  /^(-){0,1}[0-9]+$/.test(returnValue.v2) &&
                  /^((-){0,1}[0-9]+(;(-){0,1}[0-9]+)*){0,1}$/.test(
                    returnValue.v3,
                  ) &&
                  parseInt(returnValue.v1, 10) <= parseInt(returnValue.v2, 10)
                )
              ) {
                setShowValidationError(true);
                setValidationErrorMsg('Please provide a valid return');
              } else if (
                currentMethod.returnType.toLowerCase() === 'string' &&
                !validateString(returnValue)
              ) {
                setShowValidationError(true);
                setValidationErrorMsg('Please provide a valid return');
              } else if (validateParameters()) {
                const updatedEquivClass: EquivalenceClass = {
                  identifier: equivClass ? equivClass.identifier : uuidv1(),
                  name: equivClassName,
                  numberOfCases: parseInt(`${numberOfCases}`, 10),
                  expectedOutputRange: returnValue,
                  acceptableParamRanges: paramsDataRange,
                };

                // console.log('saving:', updatedEquivClass)

                // const currentMethodIndex = props.methodIndex ? props.methodIndex : props.methodsAvaliable.findIndex(m => m.name == selectedMethodName)
                setMethods((methods: Method[]) =>
                  methods.map((m) => {
                    if (m.name === selectedMethodName) {
                      if (isCreate) {
                        m.equivClasses.push(updatedEquivClass);
                      } else {
                        m.equivClasses = m.equivClasses.map((ec) =>
                          ec.identifier === updatedEquivClass.identifier
                            ? updatedEquivClass
                            : ec,
                        );
                      }
                    }
                    return m;
                  }),
                );

                showEquivClassList();
              }
            }}
          >
            Save
          </Button>
        </Grid>
      </Grid>
    </div>
  );
}
