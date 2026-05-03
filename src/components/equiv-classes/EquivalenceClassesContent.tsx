import { Method } from "../../models/Method";
import { useEffect, useState } from "react";
import { EquivalenceClass } from "../../models/EquivalenceClass";
import EquivClassList from "./EquivClassList";
import EquivClassCreateOrUpdate from "./EquivClassCreateOrUpdate";


export default function EquivalenceClassesContent(props: {methods: Method[], setMethods: any, selectedIA: string, showGenerateTests: any}) {

    function removeEquivClass(method_id: string, eq_class_id: string) {
        props.setMethods((methods_: Method[]) => methods_.map(m_ => {
            console.log('m_', m_)
            if (m_ && m_.identifier == method_id) {
                m_.equivClasses = m_.equivClasses.filter(eqc => eqc.identifier != eq_class_id)
            }
            return m_
        }));
        console.log('removed equiv class. Now:', props.methods)
    }

    const CREATE_UPDATE = 'CREATE_UPDATE'
    const LIST_EQUIV_CLASSES = 'LIST_EQUIV_CLASSES'
    
    const [isCreateEquivClass, setIsCreateEquivClass] = useState(true);
    const [currentEquivClass, setCurrentEquivClass] = useState<EquivalenceClass>()
    
    useEffect(() => {
        console.log('EquivalenceClassesContent>methods updated to', props.methods)
    }, [props.methods])

    const equivClassList = <EquivClassList 
                            methods={props.methods} 
                            onRemove={(m_id: string, ec_id: string) => removeEquivClass(m_id, ec_id)}
                            openEdit={(m_id: string, ec_id: string) => {
                                setIsCreateEquivClass(false)
                                //console.log({m_id, ec_id, found: props.methods.find(m => m.identifier == m_id)?.equivClasses.find(e => e.identifier == ec_id)})
                                
                                setCurrentEquivClass(props.methods.find(m => m.identifier == m_id)?.equivClasses.find(e => e.identifier == ec_id))
                                setCurrentView(CREATE_UPDATE)
                            }}
                            showCreateContent={() => {
                                setIsCreateEquivClass(true)
                                setCurrentEquivClass(undefined)
                                setCurrentView(CREATE_UPDATE)
                            }} 
                            showGenerateTests={props.showGenerateTests}
                        />;
    const equivClassCreateUpdate = <EquivClassCreateOrUpdate
                                    methodsAvaliable={props.methods} 
                                    isCreate={isCreateEquivClass} 
                                    setMethods={props.setMethods}
                                    selectedIA={props.selectedIA}
                                    showEquivClassList={() => {
                                        setCurrentView(LIST_EQUIV_CLASSES)
                                    }}
                                    equivClass={currentEquivClass}/>;

    const [currentView, setCurrentView] = useState(LIST_EQUIV_CLASSES)

    return (
        <>
            {currentView == LIST_EQUIV_CLASSES ? equivClassList : equivClassCreateUpdate}
        </>
    )
}
