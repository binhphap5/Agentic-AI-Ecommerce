import React from 'react'

function HeaderAdmin({title}) {
  return (
    <nav className="flex flex-row flex-wrap items-center justify-between rounded-xl bg-white p-5 w-full backdrop-blur-xl">
            <div className="ml-[6px]">
              <p className="shrink text-[33px] capitalize text-navy-700 dark:text-black">
                <a
                  className="font-bold capitalize hover:text-navy-700 dark:hover:text-black"
                  href="/admin/home"
                >
                  {title}
                </a>
              </p>
            </div>
          </nav>
  )
}

export default HeaderAdmin
