import React, { useContext, useEffect, useMemo, useState } from "react";

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
import { ToolBar } from "./toolbar";
import SearchBox from "./search-box";
import MiniSearch from "minisearch";

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
    const [searchTerm, setSearchTerm] = useState("");

    const searchIndex = useMemo(() => {
        if (!labResults) {
            return null;
        }
        let miniSearch = new MiniSearch({
            fields: ["name", "parent"], // fields to index for full-text search
            storeFields: ["data"], // fields to return with search results
        });
        miniSearch.addAll(labResults);
        return miniSearch;
    }, [labResults]);

    const fileterdResults = useMemo(() => {
        if (searchTerm == "") {
            return labResults;
        }
        return searchIndex.search(searchTerm);
    }, [labResults, searchTerm]);

    useEffect(() => {
        if (!patientId) {
            setLabResults([]);
            return;
        }
        (async () => {
            setLoading(true);
            try {
                const loadedLabResults = mergeDuplicates(
                    sanitizeLabResults(
                        await getResource(
                            `/live/df/pcc/widgets/labservices/${patientId}/max/${datewiseCount}?encounterId=`,
                            activeTab.id
                        )
                    )
                );
                const loadedLabResultsList = Object.entries(
                    loadedLabResults
                ).map(([key, result]) => ({
                    id: key,
                    name: result.name,
                    parent: result.parent,
                    data: result,
                }));
                console.log(loadedLabResultsList);
                setLabResults(loadedLabResultsList);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, [patientId]);

    const handleSelectSearchTerm = (newSearchTerm) => {
        setSearchTerm(newSearchTerm);
    };

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
        <div className="flex flex-col overflow-auto">
            <ToolBar className="bg-gray-200">
                <SearchBox
                    placeholder="Search Lab Results"
                    searchIndex={searchIndex}
                    onSelectSearchTerm={handleSelectSearchTerm}
                />
            </ToolBar>
            <div className="w-full flex flex-col overflow-auto">
                <ul className="whitespace-pre-wrap overflow-auto">
                    {fileterdResults.map((result, index) => (
                        <>
                            <li
                                key={index}
                                className="grid gap-1.5 p-1.5 even:bg-gray-200 odd:bg-gray-300"
                                style={{
                                    gridTemplateColumns:
                                        "minmax(6rem, max-content) 1fr",
                                }}
                            >
                                <div className="">
                                    {result.parent && (
                                        <div>{result.parent}</div>
                                    )}
                                    <div>{result.data.name}</div>
                                    <div>{result.data.unit}</div>
                                    <div>{result.data.range}</div>
                                </div>
                                {result.data.datewiseValues && (
                                    <div>
                                        {result.data.datewiseValues
                                            .toSorted((a, b) =>
                                                parseDate(
                                                    a.resultDate
                                                ).isBefore(
                                                    parseDate(b.resultDate)
                                                )
                                                    ? 1
                                                    : -1
                                            )
                                            .map(
                                                (datewiseItem, dateIndex) =>
                                                    datewiseItem.value && (
                                                        <ResultCard
                                                            result={
                                                                datewiseItem
                                                            }
                                                            key={dateIndex}
                                                        />
                                                    )
                                            )}
                                    </div>
                                )}
                                {result.data.hasParameter && (
                                    <div>
                                        <JSONTree
                                            data={result.data.parameters}
                                        />
                                    </div>
                                )}
                            </li>
                            {/* {
                                <li>
                                    <JSONTree data={result} />
                                </li>
                            } */}
                        </>
                    ))}
                </ul>
            </div>
        </div>
    );
}
