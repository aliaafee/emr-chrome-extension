import JSSoup from "jssoup";
import { getText } from "../../../api/emr-api";

const getPatientInfo = async (patientId, activeTabId) => {
    const patientInfoPage = await getText(
        `/live/pf/patientcontrolchartform/reload?patientId=${patientId}&closeDWBConsultation=patientcontrolchartform`,
        activeTabId,
    );

    console.log("Patient Info Page HTML:", patientInfoPage);

    const soup = new JSSoup(patientInfoPage);

    let newPatientInfo = {};
    newPatientInfo.name = soup.findAll("span", "pat-name")[0].text;

    const demographics = soup.findAll("span", "pat-demgp-det");
    newPatientInfo.sex = demographics[0].text;

    const ageDob = demographics[1].text.split(" (");
    newPatientInfo.age = ageDob[0];
    newPatientInfo.dob = ageDob[1].slice(0, -1);

    return newPatientInfo;
};

export { getPatientInfo };
