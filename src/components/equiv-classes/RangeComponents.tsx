import { Box, Button, Radio, TextField } from "@mui/material"
import { Text3, useSnackbar } from "@telefonica/mistica"
import { buildTextField } from "../CustomComponents"
import { useEffect, useState } from "react"
import { DataRange } from "../../models/DataRange"
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from "dayjs"
import DateChip from "./DateChip"
import CharChip from "./CharChip"

export function BooleanRangeComponent(props: {range: DataRange, setRange: any, label?: any}) {

    return (
        <Box style={{
            marginBottom: '12px',
            paddingTop: '16px',
            border: '1px solid rgba(1, 1, 1, 0.3)',
            borderRadius: '5px', }}
        >
           
            <div style={{
                display: 'flex',
                overflowX: 'auto',
                paddingBottom: '8px',
                width: '630px',
                scrollbarWidth: 'thin', // This applies to Firefox
                msOverflowStyle: 'none',  // This applies to Internet Explorer 10+
            }}>
                <div style={{marginLeft: '12px', marginTop: '8px', width: '450px'}}>
                    {
                        props.label ? props.label 
                        : <Text3  regular color="black">Set the expected <span style={{ fontWeight: 'bold' }}>boolean</span> return value:</Text3>
                    }
                </div>
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                    <Radio style={{color: 'black'}} value={'true'} checked={props.range.v1 == 'true'} onChange={(val) => props.setRange({...props.range, v1: val.target.value})} />
                    <div style={{width: '4px'}}></div>
                    <Text3  regular color="black">True</Text3>
                    <div style={{width: '4px'}}></div>
                    <Radio style={{color: 'black'}} value={'false'} checked={props.range.v1 == 'false'} onChange={(val) => props.setRange({...props.range, v1: val.target.value})}/>
                    <div style={{width: '4px'}}></div>
                    <Text3  regular color="black">False</Text3>
                </div>
            </div>
        </Box>
       
    )
}

export function CharRangeComponent(props: {range: DataRange, setRange: any, label?: any}) {

    const [charValue, setCharValue] = useState('');

    function updateRange(range: DataRange) {
        //TODO: validações

        
        props.setRange(range)
        
    }

    function onCharChange(newVal: any) {
        if (newVal.target.value.length > 1) {
            return; //Do not update. only one char at a time is allowed
        }
        setCharValue(newVal.target.value)
    }

    function addChar() {
        if (charValue != '' && !props.range.v1.includes(charValue)) {
            props.setRange({...props.range, v1: props.range.v1 != '' ? (props.range.v1 + ';' + charValue) : charValue})
        }
        setCharValue('')
    }

    return (
        <Box style={{
            // backgroundColor: 'red',
            // marginTop: '16px',
            marginBottom: '12px',
            paddingTop: '16px',
            // backgroundColor: 'white',
            border: '1px solid rgba(1, 1, 1, 0.3)',
            borderRadius: '5px', }}
        >
            <div style={{marginLeft: '12px'}}>{props.label ? props.label : <Text3  regular color="black">Below, set the possible values for the returning <span style={{ fontWeight: 'bold' }}>Character</span>:</Text3>}</div>

            <div style={{
                display: 'flex',
                overflowX: 'auto',
                padding: '16px',
                paddingBottom: '0px',
                width: '630px',
                scrollbarWidth: 'thin', // This applies to Firefox
                msOverflowStyle: 'none',  // This applies to Internet Explorer 10+
            }}>

                {buildTextField("Any character", charValue, onCharChange)}
                <div style={{width: '8px'}}></div>
                <Button variant="outlined" color="secondary" disableElevation style={{height: '55px'}} onClick={addChar}>Add Character</Button>
            </div>
            <CharChip range={props.range} setRange={props.setRange} />

        </Box>
       
    )
}

export function DateRangeComponent(props: {range: DataRange, setRange: any, label?: any}) {

    const [alsoIncludeDate, setAlsoIncludeDate] = useState<Dayjs>();
    const [fromDate, setFromDate] = useState<Dayjs>();
    const [toDate, setToDate] = useState<Dayjs>();

    function parseRangeDate(value: string) {
        if (!value) return undefined;

        const dateParts = value.split("-").map(Number);

        if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) {
            return dayjs(value);
        }

        if (/^[0-9]{2}-[0-9]{2}-[0-9]{4}$/.test(value)) {
            const [day, month, year] = dateParts;
            return dayjs(`${year}-${month}-${day}`);
        }

        return undefined;
    }

    useEffect(() => {
        setFromDate(parseRangeDate(props.range.v1));
        setToDate(parseRangeDate(props.range.v2));
    }, [props.range.v1, props.range.v2])

    const {openSnackbar} = useSnackbar();

    function updateRange(type: 'from' | 'to', value?: any) {
        //TODO: validações
        //openSnackbar({message: '"From" shloud be a date befor or equal to value in "To"', type: 'CRITICAL', buttonText: 'buttonText', withDismiss: true});

        // console.log('updating date. type='+ type, ' value=', value)
        if (!value) {
            return;
        }

        if (type.trim() == 'from') {
            setFromDate(value)
            props.setRange({...props.range, v1: value.format('DD-MM-YYYY')})
        } else {
            setToDate(value)
            props.setRange({...props.range, v2: value.format('DD-MM-YYYY')})
        }
        
    }

    function addDate() {
        if (alsoIncludeDate) {
            props.setRange({...props.range, v3: props.range.v3 + ((props.range.v3 && props.range.v3 != '' ? ';' : '') + alsoIncludeDate?.format('DD-MM-YYYY'))})
            console.log('addDate', props.range)
        }
    }

    return (
        <Box style={{
            // backgroundColor: 'red',
            // marginTop: '16px',
            marginBottom: '12px',
            paddingTop: '16px',
            // backgroundColor: 'white',
            border: '1px solid rgba(1, 1, 1, 0.3)',
            borderRadius: '5px', }}
        >
            <div style={{marginLeft: '12px'}}>{props.label ? props.label : <Text3  regular color="black">Below, set the range for the returning <span style={{ fontWeight: 'bold' }}>Date</span>:</Text3>}</div>

            <div style={{
                display: 'flex',
                overflowX: 'auto',
                padding: '16px',
                width: '630px',
                scrollbarWidth: 'thin', // This applies to Firefox
                msOverflowStyle: 'none',  // This applies to Internet Explorer 10+
            }}>

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker label={'From'} value={fromDate} onChange={(date) => updateRange('from', date)}  />
                </LocalizationProvider>
                <div style={{width: '8px'}}></div>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker label={'To'} value={toDate} onChange={(date) => updateRange('to', date)} />
                </LocalizationProvider>

                <div style={{width: '8px'}}></div>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker label={'Also include'} value={alsoIncludeDate} onChange={(date) => setAlsoIncludeDate(date != null ? date : undefined)} />
                </LocalizationProvider>

                <div style={{width: '8px'}}></div>
                <Button variant="outlined" color="secondary" disableElevation style={{height: '55px'}} onClick={addDate}>Add Date</Button>

            </div>
            <DateChip range={props.range} setRange={props.setRange} />

        </Box>
       
    )
}

export function NumberRangeComponent(props: {type: 'INT' | 'DOUBLE' | 'FLOAT' | string, range: DataRange, setRange: any, label?: any}) {

    const [from, setFrom] = useState(props.range.v1)

    useEffect(() => {
        if (from != props.range.v1) updateRange({...props.range, v1: from})
    }, [from]);
    

    function updateRange(range: DataRange) {
        //TODO: validações

        
        props.setRange(range)
        
    }

    function getReturningType() {
        return props.type == 'INT' ? 'integer' : props.type.toLowerCase()
    }

    function getTextInput(label: string, value: string, onChange: any, helperText?: string, larger?: boolean) {
        return <TextField id="outlined-basic" variant="outlined" 
            label={label ? label : ''} 
            value={value ? value : ''} 
            onChange={onChange}
            fullWidth
            helperText={helperText}
            style={{
                marginBottom: '12px',
                width: larger ? '280px' : '180px'
            }}
        />
    }

    return (
        <Box style={{
            // backgroundColor: 'red',
            // marginTop: '16px',
            marginBottom: '12px',
            paddingTop: '16px',
            // backgroundColor: 'white',
            border: '1px solid rgba(1, 1, 1, 0.3)',
            borderRadius: '5px', }}
        >
            <div style={{marginLeft: '12px'}}>{props.label ? props.label : <Text3  regular color="black">Below, set the value range for the returning <span style={{ fontWeight: 'bold' }}>{getReturningType()}</span> number:</Text3>}</div>

            <div style={{
                display: 'flex',
                overflowX: 'auto',
                padding: '16px',
                paddingBottom: '0px',
                width: '630px',
                scrollbarWidth: 'thin', // This applies to Firefox
                msOverflowStyle: 'none',  // This applies to Internet Explorer 10+
            }}>

                {getTextInput('From', props.range.v1, (newVal: any) => updateRange({...props.range, v1: newVal.target.value }), 'Start of ' + getReturningType() + ' range')}
                <div style={{width: '8px'}}></div>
                {getTextInput('To', props.range.v2, (newVal: any) => updateRange({...props.range, v2: newVal.target.value }), 'End of ' + getReturningType() + ' range')}
                <div style={{width: '8px'}}></div>
                {getTextInput('Also include', props.range.v3, (newVal: any) => updateRange({...props.range, v3: newVal.target.value }), 'Semicolon-separated ' + getReturningType() + ' numbers to include', true)}

            </div>
        </Box>
       
    )
}
