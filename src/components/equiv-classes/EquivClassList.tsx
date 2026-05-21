import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Grid, TextField } from "@mui/material";
import { Stack, Text5 } from "@telefonica/mistica";
import { Method } from "../../models/Method";
import { useEffect, useState } from "react";
import ValidationErrorSnackbar from "../ValidationErrorComponent";

const helpText = 
    <div style={{fontSize: '18px'}}>
        Here, an equivalence class is a tuple of a set of methods parameters and a set of possible return values for those parameters.<br/>
        <br/>
        Observe the following example:
        <br/>
        <br/>
        The method <span style={{fontWeight: 'bold'}}>isMaiorDeIdade(inteiro idade)</span>, which has as responsibility check whether a person's of legal age, 
        returns true in case the provided age is greater tha or equal to 18 years-old and false otherwise.
        <br/>
        For that example,  we could define two equivalence classes: 
        <br/>
        <br/>
        1. The class of legal age people, with return value true and, in the parameters set 18 and 65.<br/>
        2. The class of minor age people, with return value false and, as parameter set, 0, 1, 15 and 17, for
        example.<br/>
        3. The class of invalid input, with return value false and parameters -1, -2, 200, 50000.
        <br/>
        <br/>
        Note that the chosen numbers for the equivalence class is made by the user. You can make your own choices on the method's parameters and return value ranges.
        <br/>
        With those info, it's possible to define an equivalence class.
        <br/>
        <br/>
        Now it's your your turn: insert the equivalence classes you decide relevant to each previously mapped method.
    </div>

`Here, an equivalence class is a tuple of a set of methods parameters and a set of possible return values for those parameters.
                
Observe the following example:
the method isMaiorDeIdade(inteiro idade), which has as responsibility check whether a person's of legal age, returns true in case the provided age is greater tha or equal to 18 years-old and false otherwise. For that example,  we could define two equivalence classes: 
1. The class of legal age people, with return value true and, in the parameters set 18 and 65.
2. The class of minor age people, with return value false and, as parameter set, 0, 1, 15 and 17, for
example.
3. The class of invalid input, with return value false and parameters -1, -2, 200, 50000.
    
With those info, it's possible to define an equivalence class.
Now it's your your turn: insert the equivalence classes you decide relevant to each previously mapped
method.`
export default function EquivClassList(props: {methods: Method[], onRemove: any, showCreateContent: any, openEdit: any, showGenerateTests: any}) {

    const [avaliableMethods, setAvaliableMethods] = useState<Method[]>()
    const [showHelp, setShowHelp] = useState(false);

    const [showValidationError, setShowValidationError] = useState(false);
    const [validationErrorMsg, setValidationErrorMsg] = useState('');

    useEffect(() => {
        console.log('EquivClassList>methods updated to', props.methods)
        setAvaliableMethods(props.methods)
    }, [props.methods])

    function onRemove(methodId: any, eqClassId: any) {
        props.onRemove(methodId, eqClassId)
        setAvaliableMethods(ms => ms ? ms.map(m_ => {
            console.log('m_', m_)
            if (m_ && m_.identifier == methodId) {
                return {
                    ...m_,
                    equivClasses: (m_.equivClasses || []).filter(eqc => eqc.identifier != eqClassId)
                }
            }
            return m_
        }) : [])
    }

    function onSubmit() {
        if (props.methods.find(m => m.equivClasses.length > 0)) {
            props.showGenerateTests();
        } else {
            setShowValidationError(true);
            setValidationErrorMsg('Please provide at least one Equivalence Class')
        }
    }

    return (
        <div>
            <ValidationErrorSnackbar open={showValidationError} message={validationErrorMsg} changeOpenState={() => setShowValidationError(!showValidationError)} />
            <Box
                sx={{
                    height: 497,
                    overflow: 'auto',
                    paddingRight: '16px',
                    // marginTop: '16px'
                }}
            >

            <Accordion 
                elevation={0}
                expanded={showHelp}
                style={{
                    borderRadius: 5,
                    //border: '1px solid #000',
                    backgroundColor: 'transparent',
                    // marginTop: '12px',
                    minHeight: '55px'
                }}>
                <AccordionSummary
                    // expandIcon={<ArrowDropDownIcon />}
                    aria-controls="panel1-content">
                <Grid container justifyContent="flex-end" spacing={1}>
                    <Grid item xs={9}><Text5 color="black">List of all Equivalence Classes created:</Text5></Grid>
                    <Grid item xs={3}>
                        <Button 
                            variant="outlined" 
                            color="info" 
                            disableElevation 
                            fullWidth 
                            style={{height: '35px'}} 
                            onClick={() => setShowHelp(!showHelp)}>
                                {showHelp ? 'Hide Help' : 'Show Help'}
                        </Button>
                    </Grid>
                </Grid>
                </AccordionSummary>
                <AccordionDetails>
                    {helpText}
                </AccordionDetails>
            </Accordion>
                        
            {
                avaliableMethods?.map(m => m.equivClasses.map(ec => 
                                                                <Entry 
                                                                    key={ec.identifier}
                                                                    method={m.name} 
                                                                    onRemove={() => onRemove(m.identifier, ec.identifier)}
                                                                    openEdit={() => props.openEdit(m.identifier, ec.identifier)}
                                                                    equivClassName={ec.name} />))
            }
            
        </Box>
        
        <Grid container justifyContent="flex-end" spacing={1} marginTop={1}>
            <Grid item xs={2}>
                <Button variant="outlined" color="secondary" disableElevation fullWidth style={{height: '55px'}} onClick={() => 1}>Go back</Button>
            </Grid> 
            <Grid item xs={4}>
                <Button variant="outlined" color="success" disableElevation fullWidth style={{height: '55px'}} onClick={props.showCreateContent}>Add Equivalence Class</Button>
            </Grid>
            <Grid item xs={3}>
                <Button variant="outlined" color="primary" disableElevation fullWidth style={{height: '55px'}} onClick={onSubmit}>Continue to generate tests</Button>
            </Grid>
        </Grid>
        </div>
    )
}

function Entry(props: {key: any, method: string, onRemove: any, equivClassName: string, openEdit: any}) {
    const sxForDisabledFields = {
        '& .Mui-disabled': {
            color: 'rgba(1, 1, 1, 1)',
            WebkitTextFillColor: 'rgba(1, 1, 1, 1)'
        }
    };

    return (
        <div key={props.key} style={{
            // backgroundColor: '#ffffff',
            border: '1px solid rgba(1, 1, 1, 0.5)', 
            borderRadius: '5px',
            padding: '16px',
            marginTop: '16px'
        }}>
            <Stack space={2}>
                <Grid container spacing={1}>
                    <Grid item xs={10}>
                        <TextField sx={sxForDisabledFields} disabled fullWidth id="outlined-basic" label={"Method"} variant="outlined" contentEditable={false} value={props.method} style={{ marginBottom: '12px'}}/>
                    </Grid>
                    <Grid item xs={2}>
                        <Button variant="outlined" color="secondary" disableElevation fullWidth style={{height: '55px'}} onClick={props.openEdit}>Edit</Button>
                    </Grid>
                </Grid>
                <Grid container spacing={1}>
                    <Grid item xs={10}>
                        <TextField  sx={sxForDisabledFields} disabled fullWidth id="outlined-basic" label={"Equivalence class"} variant="outlined" contentEditable={false} value={props.equivClassName}/>
                    </Grid>
                    <Grid item xs={2}>
                        <Button variant="outlined" color="error" disableElevation fullWidth style={{height: '55px'}} onClick={() => props.onRemove(props.method)}>Remove</Button>
                    </Grid>
                </Grid>
            </Stack>
        </div>
    )
}
