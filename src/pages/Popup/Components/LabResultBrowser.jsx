import React, { useEffect, useState } from "react";

import EmrApi from "../../../api/EmrApi";
import ErrorMessage from "./ErrorMessage";
import LoadingSpinner from "./LoadingSpinner";
import { JSONTree } from "react-json-tree";

import "../../../styles.css";

const sanitizeLabResults = (results) => {
    return results.reduce(
        (a, result) =>
            result.formResultType === 0
                ? result.hasParameter
                    ? [
                          ...a,
                          ...result.parameters.map((parameter) => ({
                              parent: result.name,
                              ...parameter,
                          })),
                      ]
                    : result.isProfile
                    ? [
                          ...a,
                          ...result.profiles.reduce((a_profile, profile) =>
                              profile.hasParameter
                                  ? [...a_profile, ...profile.parameters.map(
                                        (parameter) => ({
                                            parent: result.name + "-" + profile.name,
                                            ...parameter
                                        })
                                    )]
                                  : [...a_profile, {
                                        parent: result.name,
                                        ...profile,
                                    }]
                          , []),
                      ]
                    : [...a, result]
                : [...a, result],
        []
    );
};

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

    const results = sanitizeLabResults(labResults.data);
    console.log(sanitizeLabResults(labResults.data));

    return (
        <div className="w-full flex flex-col overflow-auto">
            <div className="text-lg">Lab Results of {patientId}</div>
            <div>
                {labResults.data.length} Lab Results,{" "}
                {labResults.data[0].datewiseValues.length} Datewise Values
            </div>
            <div>
                <JSONTree data={labResults} />
            </div>
            <ul className="whitespace-pre-wrap overflow-auto">
                {results.map((result, index) => (
                    <li key={index}>
                        <div className="bg-blue-100">
                            {result.parent} {result.name}
                        </div>
                        {result.datewiseValues && (
                            <ul className="flex">
                                {result.datewiseValues.map(
                                    (datewiseItem, dateIndex) => (
                                        <li key={dateIndex}>
                                            <div>{datewiseItem.resultDate}</div>
                                            <div>
                                                {datewiseItem.value}{" "}
                                                {datewiseItem.unit}
                                            </div>
                                        </li>
                                    )
                                )}
                            </ul>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
