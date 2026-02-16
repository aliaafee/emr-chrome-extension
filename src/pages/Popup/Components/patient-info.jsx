import React, { useContext, useEffect, useMemo, useState } from "react";
import { ActiveTabContext } from "./activetab-context";
import JSSoup from "jssoup";
import { getText } from "../../../api/emr-api";
import { getPatientInfo } from "../Utils/patientinfo";

export default function PatientInformation({ patientId }) {
    const activeTab = useContext(ActiveTabContext);
    const [patientInfo, setPatientInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!patientId) {
            return;
        }
        const updatePatientInfo = async () => {
            setLoading(true);
            try {
                // const patientInfoPage = await getText(
                //     `/live/pf/patientcontrolchartform/reload?patientId=${patientId}&closeDWBConsultation=patientcontrolchartform`,
                //     activeTab.id
                // );

                // const soup = new JSSoup(patientInfoPage);

                // let newPatientInfo = {};
                // newPatientInfo.name = soup.findAll("span", "pat-name")[0].text;

                // const demographics = soup.findAll("span", "pat-demgp-det");
                // newPatientInfo.sex = demographics[0].text;

                // const ageDob = demographics[1].text.split(" (");
                // newPatientInfo.age = ageDob[0];
                // newPatientInfo.dob = ageDob[1].slice(0, -1);

                const gotPatientInfo = await getPatientInfo(
                    patientId,
                    activeTab.id,
                );

                setPatientInfo(gotPatientInfo);
            } catch (err) {
                setPatientInfo(null);
                setError(err);
            } finally {
                setLoading(false);
            }
        };
        updatePatientInfo();
    }, [patientId]);

    if (loading) {
        return <div>Loading patient information...</div>;
    }

    if (error) {
        return <div>{error.message}</div>;
    }

    if (!patientInfo) {
        return <div>...</div>;
    }

    return (
        <div>
            <div>
                <span className="font-bold">{patientInfo.name}</span> |{" "}
                {patientInfo.sex} | {patientInfo.age} [{patientInfo.dob}]
            </div>
        </div>
    );
}
