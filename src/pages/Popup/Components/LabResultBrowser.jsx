import React, { useEffect, useState } from "react";

import EmrApi from "../../../api/EmrApi";
import ErrorMessage from "./ErrorMessage";
import LoadingSpinner from "./LoadingSpinner";
import { JSONTree } from "react-json-tree";
import dayjs from "dayjs";

import "../../../styles.css";

const sanitizeLabResults = (results) =>
    results.data.reduce(
        (a, result) =>
            result.formResultType === 0
                ? result.hasParameter
                    ? [
                          ...a,
                          ...result.parameters.map((parameter) => ({
                              parent: result.name,
                              resultDate: result.resultDate,
                              ...parameter,
                          })),
                      ]
                    : result.isProfile
                    ? [
                          ...a,
                          ...result.profiles.reduce(
                              (a_profile, profile) =>
                                  profile.hasParameter
                                      ? [
                                            ...a_profile,
                                            ...profile.parameters.map(
                                                (parameter) => ({
                                                    parent:
                                                        result.name +
                                                        "-" +
                                                        profile.name,
                                                    resultDate:
                                                        result.resultDate,
                                                    ...parameter,
                                                })
                                            ),
                                        ]
                                      : [
                                            ...a_profile,
                                            {
                                                parent: result.name,
                                                resultDate: result.resultDate,
                                                ...profile,
                                            },
                                        ],
                              []
                          ),
                      ]
                    : [...a, result]
                : [...a, result],
        []
    );

const toSortedLabResults = (results) =>
    results.toSorted((a, b) =>
        [a.name, b.name].toSorted()[0] === a.name ? -1 : 1
    );

const parseDate = (stringDate) => dayjs(stringDate, "MMM D, YYYY h:mm:ss A");

const formateDate = (stringDate) =>
    dayjs(stringDate, "MMM D, YYYY h:mm:ss A").format("DD/MM/YYYY HH:mm:ss");

const isInRange = (result) => {
    if (result.range === "-") return true;
    if (!result.range) return true;
    if (!result.value) return true;
    const range = result.range.split("-").map((r) => Number(r));
    const value = Number(result.value);
    if (value < range[0]) return false;
    if (value > range[1]) return false;
    return true;
};

const ResultCard = ({ result }) => (
    <div className="inline-block bg-gray-300 w-28 p-1.5 m-1.5 rounded">
        <div
            className={`font-bold text-center ${
                isInRange(result) ? "text-black" : "text-red-600"
            }`}
        >
            {result.value} {result.unit}
        </div>
        <div className="text-center">{result.range}</div>
        <div className="text-center text-gray-600">
            {parseDate(result.resultDate).format("DD/MM/YYYY")}
        </div>
        <div className="text-center text-gray-600">
            {parseDate(result.resultDate).format("HH:mm:ss")}
        </div>
    </div>
);

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
                    sanitizeLabResults(
                        await EmrApi.getResource(
                            `/live/df/pcc/widgets/labservices/${patientId}/max/${datewiseCount}?encounterId=`,
                            targetTabId
                        )
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
        <div className="w-full flex flex-col overflow-auto">
            <div className="text-lg">Lab Results of {patientId}</div>
            <ul className="whitespace-pre-wrap overflow-auto">
                {toSortedLabResults(labResults).map((result, index) => (
                    <li key={index}>
                        <div className="bg-blue-100">
                            {formateDate(result.resultDate)} {result.name}{" "}
                            {result.parent}
                        </div>
                        {/* <JSONTree data={result} /> */}
                        {result.datewiseValues && (
                            <div>
                                {result.datewiseValues.map(
                                    (datewiseItem, dateIndex) =>
                                        datewiseItem.value && (
                                            <ResultCard result={datewiseItem} />
                                        )
                                )}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
