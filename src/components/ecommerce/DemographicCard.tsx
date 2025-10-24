import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import CountryMap from "./CountryMap";

export default function DemographicCard() {
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Employee Demographics
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Number of employees based on nationality
          </p>
        </div>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              View More
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Delete
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
      <div className="px-4 py-6 my-6 overflow-hidden border border-gary-200 rounded-2xl dark:border-gray-800 sm:px-6">
        <div
          id="mapOne"
          className="mapOne map-btn -mx-4 -my-6 h-[212px] w-[252px] 2xsm:w-[307px] xsm:w-[358px] sm:-mx-6 md:w-[668px] lg:w-[634px] xl:w-[393px] 2xl:w-[554px]"
        >
          <CountryMap />
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="items-center w-full rounded-full max-w-8">
              <img src="./images/country/country-01.svg" alt="india" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                India
              </p>
              <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                1,247 Employees
              </span>
            </div>
          </div>

          <div className="flex w-full max-w-[140px] items-center gap-3">
            <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
              <div className="absolute left-0 top-0 flex h-full w-[45%] items-center justify-center rounded-sm bg-brand-500 text-xs font-medium text-white"></div>
            </div>
            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
              45%
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="items-center w-full rounded-full max-w-8">
              <img src="./images/country/country-02.svg" alt="pakistan" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                Pakistan
              </p>
              <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                589 Employees
              </span>
            </div>
          </div>

          <div className="flex w-full max-w-[140px] items-center gap-3">
            <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
              <div className="absolute left-0 top-0 flex h-full w-[21%] items-center justify-center rounded-sm bg-brand-500 text-xs font-medium text-white"></div>
            </div>
            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
              21%
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="items-center w-full rounded-full max-w-8">
              <img src="./images/country/country-03.svg" alt="philippines" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                Philippines
              </p>
              <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                423 Employees
              </span>
            </div>
          </div>

          <div className="flex w-full max-w-[140px] items-center gap-3">
            <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
              <div className="absolute left-0 top-0 flex h-full w-[15%] items-center justify-center rounded-sm bg-brand-500 text-xs font-medium text-white"></div>
            </div>
            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
              15%
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="items-center w-full rounded-full max-w-8">
              <img src="./images/country/country-04.svg" alt="bangladesh" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                Bangladesh
              </p>
              <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                312 Employees
              </span>
            </div>
          </div>

          <div className="flex w-full max-w-[140px] items-center gap-3">
            <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
              <div className="absolute left-0 top-0 flex h-full w-[11%] items-center justify-center rounded-sm bg-brand-500 text-xs font-medium text-white"></div>
            </div>
            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
              11%
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="items-center w-full rounded-full max-w-8">
              <img src="./images/country/country-05.svg" alt="nepal" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                Nepal
              </p>
              <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                276 Employees
              </span>
            </div>
          </div>

          <div className="flex w-full max-w-[140px] items-center gap-3">
            <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
              <div className="absolute left-0 top-0 flex h-full w-[8%] items-center justify-center rounded-sm bg-brand-500 text-xs font-medium text-white"></div>
            </div>
            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
              8%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
