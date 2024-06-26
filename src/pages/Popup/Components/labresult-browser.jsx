import React, { useContext, useEffect, useState } from "react";

import {
    formateDate,
    formateTime,
    getResource,
    parseDate,
} from "../../../api/emr-api";
import ErrorMessage from "./error-message";
import LoadingSpinner from "./loading-spinner";
import { JSONTree } from "react-json-tree";

import "../../../styles.css";
import { ActiveTabContext } from "./activetab-context";

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
                                                    parent: result.name,
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

const mergeDuplicates = (results) =>
    results.reduce((a, result) => {
        if (result.name in a) {
            const uniqueDatewiseValues = result.datewiseValues.filter(
                (value) =>
                    !a[result.name].datewiseValues.reduce(
                        (a, v) => a || v.labResultId === value.labResultId,
                        false
                    )
            );
            a[result.name].datewiseValues = [
                ...a[result.name].datewiseValues,
                ...uniqueDatewiseValues,
            ];
            if ("sources" in a[result.name]) {
                a[result.name]["sources"] = [...a[result.name].sources, result];
            } else {
                a[result.name]["sources"] = [result];
            }
            return a;
        }
        return {
            ...a,
            [result.name]: result,
        };
    }, {});

// const parseDate = (stringDateTime) =>
//     dayjs(stringDateTime, "MMM D, YYYY h:mm:ss A");

// const formateDateTime = (stringDateTime) =>
//     dayjs(stringDateTime, "MMM D, YYYY h:mm:ss A").format(
//         "DD/MM/YYYY HH:mm:ss"
//     );

// const formateDate = (stringDateTime) =>
//     dayjs(stringDateTime, "MMM D, YYYY h:mm:ss A").format("DD/MM/YYYY");

// const formateTime = (stringDateTime) =>
//     dayjs(stringDateTime, "MMM D, YYYY h:mm:ss A").format("HH:mm:ss");

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
    <div className="inline-block min-w-28">
        <div
            className={`font-bold ${
                isInRange(result) ? "text-black" : "text-red-600"
            }`}
        >
            {result.value}
        </div>
        <div className="text-gray-600">{formateDate(result.resultDate)}</div>
        <div className="text-gray-600">{formateTime(result.resultDate)}</div>
    </div>
);

export default function LabResultBrowser({ patientId, datewiseCount = 10 }) {
    const activeTab = useContext(ActiveTabContext);
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
                    mergeDuplicates(
                        sanitizeLabResults(
                            await getResource(
                                `/live/df/pcc/widgets/labservices/${patientId}/max/${datewiseCount}?encounterId=`,
                                activeTab.id
                            )
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
                <ErrorMessage
                    title="Lab Result Browser Error"
                    message={error.message}
                />
            </div>
        );
    }

    if (!labResults) {
        return (
            <div className="w-full h-full flex">
                <ErrorMessage
                    title="No Lab Results"
                    message={!patientId && "No Patient Selected"}
                />
            </div>
        );
    }

    console.log(labResults);

    return (
        <div className="w-full flex flex-col overflow-auto">
            <ul className="whitespace-pre-wrap overflow-auto">
                {Object.entries(labResults).map(([key, result]) => (
                    <>
                        <li
                            key={key}
                            className="grid gap-1.5 p-1.5 even:bg-gray-200 odd:bg-gray-300"
                            style={{
                                gridTemplateColumns:
                                    "minmax(6rem, max-content) 1fr",
                            }}
                        >
                            <div className="">
                                {result.parent && <div>{result.parent}</div>}
                                <div>{result.name}</div>
                                <div>{result.unit}</div>
                                <div>{result.range}</div>
                            </div>
                            {result.datewiseValues && (
                                <div>
                                    {result.datewiseValues
                                        .toSorted((a, b) =>
                                            parseDate(a.resultDate).isBefore(
                                                parseDate(b.resultDate)
                                            )
                                                ? 1
                                                : -1
                                        )
                                        .map(
                                            (datewiseItem, dateIndex) =>
                                                datewiseItem.value && (
                                                    <ResultCard
                                                        result={datewiseItem}
                                                        key={dateIndex}
                                                    />
                                                )
                                        )}
                                </div>
                            )}
                        </li>
                        {/* <li>
                            <JSONTree data={result} />
                        </li> */}
                    </>
                ))}
            </ul>
        </div>
    );
}
