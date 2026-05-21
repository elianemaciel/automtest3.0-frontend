import { Box, Button, FormControl, Grid, InputLabel, MenuItem, Select } from "@mui/material"
import { Text3} from "@telefonica/mistica"
import { buildTextField } from "../../CustomComponents"
import { useEffect, useState } from "react"
import { DataRange } from "../../../models/DataRange"
import { StringDataRangePiece, StringRangePieceType } from "../../../models/StringDataRange"
import { v1 as uuidv1 } from 'uuid';


export function StringRangeComponent(props: {range: DataRange, setRange: any, addEmptyStringRange: any, onRemove: any, label?: any}) {

    const [pieces, setPieces] = useState(getRangeData(props.range).pieces);

    useEffect(() => {
        setPieces(getRangeData(props.range).pieces);
    }, [props.range.v1, props.range.v2])

    function updatePieces(data: any) {
        console.log('updatePieces.data', data)
        const convertedPieces = data.map((p: any) => {
            let content : string = p.type.value == 'manually_specify' ? p.content : p.type.value;
            content = '[' + (content ? content : '') + ']'
            const quantity = '[' + p.from + '~' + p.to + ']'
            //console.log('data.map.item', {content: content, quantity: quantity})
            return {content: content, quantity: quantity}
        })
        
        const completeContent = convertedPieces.map((cp: any) => cp.content).join('')
        const completeQuantities = convertedPieces.map((cp: any) => cp.quantity).join('')

        props.setRange({
            param_id: props.range.param_id,
            v1: completeContent,
            v2: completeQuantities,
            v3: ''
        })

        setPieces(data)
    }

    function getRangeData(range: DataRange) {
        
        //console.log('getRangeData=', range)
        
        if (!range.v1) <div></div>

        const content = range.v1.length > 2 ? range.v1.slice(1, -1).split('][') : [];
        const quantity = range.v2.length > 2 ? range.v2.slice(1, -1).split('][') : [];
        
        // console.log('content.StringRangeComponent=', content)
        const pieces : StringDataRangePiece[] = []
        for (let i = 0; i < content.length; i++) {
            const contentPiece = content[i]
            const quantityPiece = quantity[i]

            const type : any = StringRangePieceType.some(t => t.value == contentPiece) ? StringRangePieceType.find(t => t.value == contentPiece) :  StringRangePieceType.find(t => t.value == 'manually_specify')
            const content_ = type?.value == 'manually_specify' ? contentPiece : ''
            const from = quantityPiece.split('~')[0]
            const to = quantityPiece.split('~')[1]
            
            pieces.push({
                id: uuidv1(),
                type: type,
                content: content_,
                from: from,
                to: to
            })

        }
        return {pieces: pieces}
    }

    function moveElementLeft<T>(arr: T[], index: number): T[] {
        
        const arrCopy = JSON.parse(JSON.stringify(arr));

        if (index > 0 && index < arrCopy.length) {
            // Swap the element with the one before it
            [arrCopy[index - 1], arrCopy[index]] = [arrCopy[index], arrCopy[index - 1]];
            console.log('tmoveElementLeft=', index, arrCopy)
        } else {
            console.log('fmoveElementLeft=', index, arrCopy)
        }
        return arrCopy;
    }

    function moveElementRight<T>(arr: T[], index: number): T[] {

        const arrCopy = JSON.parse(JSON.stringify(arr));

        if (index >= 0 && index < arrCopy.length - 1) {
            // Swap the element with the one after it
            [arrCopy[index], arrCopy[index + 1]] = [arrCopy[index + 1], arrCopy[index]];
            console.log('tmoveElementRight=', index, arrCopy)
        } else {
            console.log('fmoveElementRight=', index, arrCopy)
        }
        return arrCopy;
    }
    const large = false;
    const manuallySpecifyType = {text: "Manually specify", value: "manually_specify"}
    
    return (
        <Box style={{
            // backgroundColor: 'red',
            marginTop: '16px',
            marginBottom: '12px',
            paddingTop: '16px',
            // backgroundColor: 'white',
            border: '1px solid rgba(1, 1, 1, 0.3)',
            borderRadius: '5px', }}
        >
            <div style={{marginLeft: '12px'}}>{props.label ? props.label : <Text3  regular color="black">{props.label ? props.label : 'Below, design the pattern of the returning String:'}</Text3>}</div>
            <div style={{
                display: 'flex',
                overflowX: 'auto',
                padding: '16px',
                width: '630px',
                marginBottom: '12px',
                scrollbarWidth: 'thin', // This applies to Firefox
                msOverflowStyle: 'none',  // This applies to Internet Explorer 10+
            }}>
                {
                    pieces.map((p: StringDataRangePiece) => 
                                            <StringRangePiece 
                                                    onRemove={() => updatePieces(pieces.filter(inner_p => inner_p.id != p.id))}
                                                    piece={p}
                                                    updatePiece={(updated: any) => {
                                                        console.log('updatedPiece:', updated)
                                                        updatePieces(pieces.map(p_ => p_.id == updated.id ? updated : p_))
                                                    }}
                                                    moveLeft={() => updatePieces(moveElementLeft(pieces, pieces.findIndex(p_ => p.id == p_.id)))}
                                                    moveRight={() => updatePieces(moveElementRight(pieces, pieces.findIndex(p_ => p.id == p_.id)))}
                                                    />)
                }
                <div style={{width: '100%'}}></div>

                <Button variant="outlined" color="primary" disableElevation fullWidth style={{height: '213px', maxWidth: '50px'}} 
                    onClick={() => updatePieces([...pieces, {id: uuidv1(), type: '', content: '', from: '', to: ''}])}>Add more</Button>
            </div>
        
        </Box>
    );
}

export function StringRangePiece(props: { onRemove: any, piece: StringDataRangePiece, updatePiece: any, moveRight: any, moveLeft: any}) {

    return (
        <div style={{minWidth: '250px', maxWidth: '250px', marginRight: '16px', backgroundColor: 'transparent', border: '1px solid gray', borderRadius: '5px', padding: '12px'}}>
        <FormControl>                                    
                                    
        <FormControl fullWidth>                                    
            <InputLabel  id="demo-simple-select-label" style={{fontSize: '13px'}}>Type</InputLabel>
            <Select id="outlined-basic" variant="outlined" 
                value={props.piece.type.value}
                label="Type"
                style={{height: '37px', marginBottom: '12px', fontSize: '12px'}}
                // onChange={val => setType(val.target.value)}>
                onChange={val => {
                        //console.log('valToUpdatePiece', val)
                        const updatedType = StringRangePieceType.find(srt => srt.value == val.target.value)
                        props.updatePiece({...props.piece, type: updatedType})
                        return val.target.value
                    }}>
                {
                    StringRangePieceType.map(v => <MenuItem value={v.value}>{v.text}</MenuItem>)
                }
            </Select>
        </FormControl>
        
        {
            props.piece.type.value == 'manually_specify' ?
                buildTextField("Content", props.piece.content, (v: any) => props.updatePiece({...props.piece, content: v.target.value}), true)
                :
            <div style={{height: '50px'}}></div>
        }
         
        <Grid container  spacing={0} width={'100%'} justifyContent={'space-between'} justifyItems={'center'}>
            <Grid item xs={5.8} width={'100%'} marginRight={'1px'}>
                {buildTextField("From", props.piece.from, (v: any) => props.updatePiece({...props.piece, from: v.target.value}), true)}
            </Grid>
            <Grid item xs={5.8} marginLeft={'1px'}>
                {buildTextField("To", props.piece.to, (v: any) => props.updatePiece({...props.piece, to: v.target.value}), true)}
            </Grid>
        </Grid>

        <Grid container  spacing={0} width={'100%'} justifyContent={'space-between'} justifyItems={'center'}>
            <Grid item xs={3} width={'100%'} marginRight={'1px'}>
                <Button variant="outlined" color="secondary" disableElevation fullWidth style={{height: '37px', width: '100%'}} onClick={props.moveLeft}>{'<'}</Button>
            </Grid>
            <Grid item xs={5} width={'100%'} marginRight={'1px'}>
                <Button variant="outlined" color="error" disableElevation fullWidth style={{height: '37px'}} onClick={props.onRemove}>{'Remove'}</Button>
            </Grid>
            <Grid item xs={3} width={'100%'} marginRight={'1px'}>
                <Button variant="outlined" color="secondary" disableElevation fullWidth style={{height: '37px'}} onClick={props.moveRight}>{'>'}</Button>
            </Grid>
        </Grid>

    </FormControl>
        </div>
    )
}
