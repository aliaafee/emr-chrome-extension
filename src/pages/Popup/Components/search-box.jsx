import { SearchIcon } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";

export default function SearchBox({
    searchIndex,
    onSelectSearchTerm,
    width = "400px",
}) {
    const [searchText, setSearchText] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);
    const [selectedSuggestion, setSelectedSuggestion] = useState(-1);

    const suggestions = useMemo(() => {
        if (searchText == "") {
            return [];
        }
        return searchIndex.autoSuggest(searchText, { fuzzy: 0.2 });
    }, [searchIndex, searchText]);

    useEffect(() => {
        setSelectedSuggestion(-1);
    }, [suggestions, searchText]);

    const handleSearchKeyPress = (e) => {
        if (e.keyCode == 13) {
            if (suggestions.length > 0) {
                if (selectedSuggestion > -1) {
                    onSelectSearchTerm(
                        suggestions[selectedSuggestion].suggestion
                    );
                    setSearchText(suggestions[selectedSuggestion].suggestion);
                    setSelectedSuggestion(-1);
                    e.target.blur();
                    return;
                }
            }
            onSelectSearchTerm(searchText);
            e.target.blur();
        }

        if (suggestions.length > 0) {
            if (e.keyCode == 40) {
                e.preventDefault();
                const next = selectedSuggestion + 1;
                if (next > suggestions.length - 1) {
                    setSelectedSuggestion(-1);
                    return;
                }
                setSelectedSuggestion(next);
            }

            if (e.keyCode == 38) {
                e.preventDefault();
                const next = selectedSuggestion - 1;
                if (next < 0) {
                    setSelectedSuggestion(-1);
                    return;
                }
                setSelectedSuggestion(next);
            }
        }
    };

    const handleSearchKeyDown = (e) => {
        if (e.keyCode == 40 || e.keyCode == 38) {
            e.preventDefault();
        }
    };

    return (
        <div
            className="px-1.5 py-[5px] m-0.5 bg-white rounded-md border-[1px] border-gray-400"
            style={{ width: width }}
        >
            <div className="flex gap-1.5 w-full items-center justify-center">
                <SearchIcon size={16} />
                <input
                    className="outline-none bg-transparent grow"
                    placeholder="Search Notes"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    onKeyUp={handleSearchKeyPress}
                    onKeyDown={handleSearchKeyDown}
                    style={{
                        color:
                            suggestions.length > 0 &&
                            selectedSuggestion > -1 &&
                            "transparent",
                        textShadow:
                            suggestions.length > 0 &&
                            selectedSuggestion > -1 &&
                            "0px 0px 0px #666",
                    }}
                />
            </div>
            {suggestions.length > 0 && searchFocused && (
                <ul
                    className="absolute z-10 float-start max-h-[400px] bg-white border-[1px] border-gray-400 shadow-md overflow-y-auto ml-[-7px] mt-[9px] rounded-md flex flex-col "
                    style={{ width: width }}
                >
                    {suggestions.map((item, index) => (
                        <li
                            className={twMerge(
                                "pl-5 p-1.5 hover:bg-gray-400",
                                index == selectedSuggestion && "bg-gray-400"
                            )}
                            key={index}
                        >
                            {item.suggestion}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
