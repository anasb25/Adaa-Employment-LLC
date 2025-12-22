import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { usePermissions } from "../hooks/usePermissions";

// Assume these icons are imported from an icon library
import {
  ChevronDownIcon,
  GridIcon,
  GroupIcon,
  HorizontaLDots,
  TaskIcon,
  UserCircleIcon,
  BuildingIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import UserDropdown from "../components/header/UserDropdown";
// import SidebarWidget from "./SidebarWidget";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  permission?: string | { permissions: string[]; operator?: "any" | "all" };
  subItems?: {
    name: string;
    path: string;
    pro?: boolean;
    new?: boolean;
    permission?: string | { permissions: string[]; operator?: "any" | "all" };
  }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    subItems: [{ name: "Employment Overview", path: "/", pro: false }],
  },
  {
    name: "Employees",
    icon: <GroupIcon />,
    permission: "employee:read",
    subItems: [
      {
        name: "Employees",
        path: "/employees",
        pro: false,
        permission: "employee:read",
      },
      {
        name: "Skills",
        path: "/skills",
        pro: false,
        permission: "skill:read",
      },
      {
        name: "Skill Types",
        path: "/admin/skill-types",
        pro: false,
        permission: "skill:read",
      },
    ],
  },
  {
    name: "Projects",
    icon: <BuildingIcon />,
    subItems: [
      {
        name: "Clients",
        path: "/clients",
        pro: false,
      },
      {
        name: "Projects",
        path: "/projects",
        pro: false,
      },
    ],
  },
  {
    name: "Mobilizations",
    icon: <TaskIcon />,
    path: "/mobilizations/daily",
    permission: "employee:read",
  },
  {
    name: "Timesheets",
    icon: <TaskIcon />,
    path: "/timesheets/monthly",
    permission: "employee:read",
  },
  {
    name: "Admin",
    icon: <UserCircleIcon />,
    permission: {
      permissions: ["user:read", "role:read"],
      operator: "any",
    }, // Admin section requires either user or role read permission
    subItems: [
      {
        name: "User Invitations",
        path: "/admin/invitations",
        pro: false,
        permission: "user:create", // Simple permission - invitations require user create permission
      },
      {
        name: "Role Management",
        path: "/admin/roles",
        pro: false,
        permission: {
          permissions: ["role:read", "role:create"],
          operator: "all",
        }, // Role management requires BOTH role read AND create permissions
      },
      {
        name: "User Management",
        path: "/admin/users",
        pro: false,
        permission: "user:read", // User management requires user read permission
      },
    ],
  },
];
// {
//   name: "Forms",
//   icon: <ListIcon />,
//   subItems: [{ name: "Form Elements", path: "/form-elements", pro: false }],
// },
// {
//   name: "Tables",
//   icon: <TableIcon />,
//   subItems: [{ name: "Basic Tables", path: "/basic-tables", pro: false }],
// },
// {
//   name: "Pages",
//   icon: <PageIcon />,
//   subItems: [
//     { name: "Blank Page", path: "/blank", pro: false },
//     { name: "404 Error", path: "/error-404", pro: false },
//   ],
// },

// Commented out - readymade theme components not being used
// const othersItems: NavItem[] = [
//   {
//     icon: <PieChartIcon />,
//     name: "Analytics",
//     subItems: [
//       { name: "Employment Trends", path: "/line-chart", pro: false },
//       { name: "Performance Metrics", path: "/bar-chart", pro: false },
//     ],
//   },
//   {
//     icon: <BoxCubeIcon />,
//     name: "Components",
//     subItems: [
//       { name: "Alerts", path: "/alerts", pro: false },
//       { name: "Avatar", path: "/avatars", pro: false },
//       { name: "Badge", path: "/badge", pro: false },
//       { name: "Buttons", path: "/buttons", pro: false },
//       { name: "Images", path: "/images", pro: false },
//       { name: "Videos", path: "/videos", pro: false },
//     ],
//   },
//   {
//     icon: <PlugInIcon />,
//     name: "Authentication",
//     subItems: [{ name: "Sign In", path: "/signin", pro: false }],
//   },
// ];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { hasPermission } = usePermissions();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    // Only check main navItems since othersItems is commented out
    ["main"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : []; // othersItems is commented out
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  // Helper function to check complex permissions
  const checkPermission = (
    permission: string | { permissions: string[]; operator?: "any" | "all" }
  ): boolean => {
    if (typeof permission === "string") {
      return hasPermission(permission);
    }

    const { permissions, operator = "all" } = permission;

    if (operator === "any") {
      return permissions.some((perm) => hasPermission(perm));
    } else {
      return permissions.every((perm) => hasPermission(perm));
    }
  };

  // Filter nav items based on permissions
  const filterNavItems = (items: NavItem[]): NavItem[] => {
    return items
      .filter((item) => {
        // Check if user has permission for the main item
        if (item.permission && !checkPermission(item.permission)) {
          return false;
        }

        // Filter subItems based on permissions
        if (item.subItems) {
          const filteredSubItems = item.subItems.filter((subItem) => {
            if (subItem.permission && !checkPermission(subItem.permission)) {
              return false;
            }
            return true;
          });

          // Only show the main item if it has visible subItems
          return filteredSubItems.length > 0;
        }

        return true;
      })
      .map((item) => ({
        ...item,
        subItems: item.subItems?.filter((subItem) => {
          if (subItem.permission && !checkPermission(subItem.permission)) {
            return false;
          }
          return true;
        }),
      }));
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => {
    const filteredItems = filterNavItems(items);

    return (
      <ul className="flex flex-col gap-4">
        {filteredItems.map((nav, index) => (
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`menu-item group ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-active"
                    : "menu-item-inactive"
                } cursor-pointer ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                }`}
              >
                <span
                  className={`menu-item-icon-size  ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <ChevronDownIcon
                    className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                      openSubmenu?.type === menuType &&
                      openSubmenu?.index === index
                        ? "rotate-180 text-brand-500"
                        : ""
                    }`}
                  />
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  className={`menu-item group ${
                    isActive(nav.path)
                      ? "menu-item-active"
                      : "menu-item-inactive"
                  }`}
                >
                  <span
                    className={`menu-item-icon-size ${
                      isActive(nav.path)
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">{nav.name}</span>
                  )}
                </Link>
              )
            )}
            {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => {
                  subMenuRefs.current[`${menuType}-${index}`] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height:
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? `${subMenuHeight[`${menuType}-${index}`]}px`
                      : "0px",
                }}
              >
                <ul className="mt-2 space-y-1 ml-9">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        to={subItem.path}
                        className={`menu-dropdown-item ${
                          isActive(subItem.path)
                            ? "menu-dropdown-item-active"
                            : "menu-dropdown-item-inactive"
                        }`}
                      >
                        {subItem.name}
                        <span className="flex items-center gap-1 ml-auto">
                          {subItem.new && (
                            <span
                              className={`ml-auto ${
                                isActive(subItem.path)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                            >
                              new
                            </span>
                          )}
                          {subItem.pro && (
                            <span
                              className={`ml-auto ${
                                isActive(subItem.path)
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                            >
                              pro
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-[100] border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/" className="flex items-center">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                src="/images/logo/logo-icon.png"
                alt="Logo"
                width={32}
                height={32}
                className="block dark:invert"
                style={{ minWidth: 32, minHeight: 32 }}
              />
              <span className="ml-3 text-black dark:text-white text-lg font-semibold">
                ADAA Employment LLC
              </span>
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.png"
              alt="Logo"
              width={32}
              height={32}
              className="block dark:invert"
              style={{ minWidth: 32, minHeight: 32 }}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar flex-1">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
            {/* Commented out - Tools section with readymade theme components */}
            {/* <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Tools"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div> */}
          </div>
        </nav>
        {/* Commented out - SidebarWidget with Employment Management promotional content */}
        {/* {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null} */}
      </div>
      {/* User Menu at Bottom */}
      <div className="mt-auto pt-4 pb-5 border-t border-gray-200 dark:border-gray-800">
        <div
          className={`flex ${
            !isExpanded && !isHovered && !isMobileOpen
              ? "lg:justify-center"
              : "justify-start"
          }`}
        >
          <UserDropdown />
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
