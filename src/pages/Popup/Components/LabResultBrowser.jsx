import React, { useEffect, useState } from "react";

import EmrApi from "../../../api/EmrApi";
import ErrorMessage from "./ErrorMessage";
import LoadingSpinner from "./LoadingSpinner";
import { JSONTree } from "react-json-tree";

import "../../../styles.css";

export default function LabResultBrowser({
    patientId,
    targetTabId = null,
    datewiseCount = 10,
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [labResults, setLabResults] = useState(null);

    useEffect(() => {
        if (!patientId) {
            setLabResults(null);
            return;
        }
        (async () => {
            setLoading(true);
            try {
                setLabResults(
                    await EmrApi.getResource(
                        `/live/df/pcc/widgets/labservices/${patientId}/max/${datewiseCount}?encounterId=`,
                        targetTabId
                    )
                );
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, [patientId]);

    if (loading) {
        return (
            <div className="w-full h-full flex">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full flex">
                <ErrorMessage title="Error" message={error.message} />
            </div>
        );
    }

    if (!labResults) {
        return (
            <div className="w-full h-full flex">
                <ErrorMessage
                    title="No Studies"
                    message={!patientId && "No Patient Selected"}
                />
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col">
            <div className="text-lg">Lab Results of {patientId}</div>
            <div>
                {labResults.data.length} Lab Results,{" "}
                {labResults.data[0].datewiseValues.length} Datewise Values
            </div>
            <ul className="whitespace-pre-wrap overflow-auto">
                {labResults.data.map((result, index) => (
                    // (result.hasParameter) ? (
                    //     result.parameters.map((parameter, index) => (
                    //         <li>
                    //             <div>{result.name}-{parameter.name}</div>
                    //             <JSONTree data={parameter} />
                    //         </li>
                    //     ))
                    // ) : (
                    //     <li>
                    //         <div>{result.name}</div>
                    //         <JSONTree data={result} />
                    //     </li>
                    // )
                    (result.formResultType === 0) ? (
                        <li>
                            <div>
                                {result.name}
                            </div>
                            <JSONTree data={result} />
                        </li>
                    ) : (
                        <li>
                            <div>
                                Culture Result {result.name}
                            </div>
                            <JSONTree data={result} />
                        </li>
                    )
                ))}
            </ul>
        </div>
    );
}
