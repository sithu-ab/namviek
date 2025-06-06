import ListPreset from '@/components/ListPreset'
import MultiMemberPicker from '@/components/MultiMemberPicker'
import PointSelect from '@/components/PointSelect'
import PrioritySelect from '@/components/PrioritySelect'
import TaskImport from '@/features/TaskImport'
import { DatePicker } from '@ui-components'
import FormGroup from 'packages/ui-components/src/components/FormGroup'
import { useEffect, useState } from 'react'
import { AiOutlineSearch } from 'react-icons/ai'
import CalendarModeFilter from './CalendarModeFilter'
import { ETaskFilterGroupByType, useTaskFilter } from './context'
import './style.css'
import { useProjectViewList } from '../ProjectView/useProjectViewList'
import { ProjectViewType } from '@prisma/client'
import StatusSelectMultiple from '@/components/StatusSelectMultiple'
import useTaskFilterContext from './useTaskFilterContext'
import { useUser } from '@auth-client'

let timeout = 0
interface ITaskFilterProps {
  searchEnabled?: boolean
  pointEnabled?: boolean
  assigneeEnable?: boolean
  importEnable?: boolean
}

export default function TaskFilter({
  searchEnabled = true,
  pointEnabled = true,
  assigneeEnable = true,
  importEnable = true
}: ITaskFilterProps) {
  const [txt, setTxt] = useState('')
  const { filter, setFilterValue, updateGroupByFilter } = useTaskFilterContext()
  const { currentViewType } = useProjectViewList()
  const { user } = useUser()

  const {
    dateOperator,
    date,
    startDate,
    endDate,
    point,
    priority,
    assigneeIds,
    statusIds
  } = filter

  if (!assigneeIds) {
    console.error(`${assigneeIds} is undefined, use ALL for default`)
  }

  const updatedAssigneeIds = assigneeIds ? assigneeIds.map(uid => {
    if (uid === 'ME' && user?.id) {
      return user.id
    }

    return uid
  }) : ['ALL']

  const isDateRange = date === 'date-range'
  const isCalendarMode = currentViewType === ProjectViewType.CALENDAR
  const isTeamMode = currentViewType === ProjectViewType.TEAM
  const isShowStatusFilter =
    currentViewType === ProjectViewType.CALENDAR ||
    currentViewType === ProjectViewType.BOARD
  const showOperator = ['this-month', 'this-week', 'today']

  const onSearch = (val: string) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      setFilterValue('term', val)
    }, 350) as unknown as number
  }

  return (
    <div className="task-filter">
      <div className="flex items-center gap-2">
        {searchEnabled ? (
          <>
            <AiOutlineSearch className="text-gray-400" />
            <input
              className="text-sm outline-none dark:bg-gray-900"
              // value={txt}
              onChange={ev => {
                // setTxt(ev.target.value)
                onSearch(ev.target.value)
              }}
              placeholder="Search ..."
            />
          </>
        ) : null}
      </div>

      <div className="task-filter-actions">
        <FormGroup>
          {isCalendarMode ? (
            <CalendarModeFilter />
          ) : (
            <>
              {/* {date && showOperator.includes(date) && ( */}
              {/*   <ListPreset */}
              {/*     value={dateOperator} */}
              {/*     onChange={val => { */}
              {/*       setFilterValue('dateOperator', val) */}
              {/*     }} */}
              {/*     className="w-[100px] mr-1" */}
              {/*     width={100} */}
              {/*     options={[ */}
              {/*       { id: '=', title: 'Equal' }, */}
              {/*       { id: '>', title: 'After' }, */}
              {/*       { id: '<', title: 'Before' } */}
              {/*     ]} */}
              {/*   /> */}
              {/* )} */}
              <ListPreset
                className="w-[150px]"
                value={date}
                onChange={val => {
                  setFilterValue('date', val)
                  setFilterValue('dateOperator', '=')
                }}
                width={180}
                options={[
                  { id: 'today', title: '📆 Today' },
                  { id: 'yesterday', title: '📆 Yesterday' },
                  { id: 'tomorrow', title: '📆 Tomorrow' },
                  { id: 'this-week', title: '📆 This week' },
                  { id: 'prev-week', title: '📆 Previous week' },
                  { id: 'this-month', title: '📆 This month' },
                  { id: 'prev-month', title: '📆 Previous month' },
                  { id: 'not-set', title: '📆 Not set' },
                  { id: 'date-range', title: '📆 Date range' }
                ]}
              />
            </>
          )}
          {isDateRange && !isCalendarMode ? (
            <>
              <DatePicker
                value={startDate}
                onChange={val => {
                  setFilterValue('startDate', val)
                }}
              />
              <DatePicker
                value={endDate}
                onChange={val => {
                  setFilterValue('endDate', val)
                }}
              />
            </>
          ) : null}
        </FormGroup>

        {pointEnabled ? (
          <PointSelect
            value={point}
            onChange={val => {
              setFilterValue('point', val)
            }}
            zero={true}
            infinite={true}
          />
        ) : null}

        {isShowStatusFilter ? (
          <StatusSelectMultiple
            noName={true}
            maxDisplay={2}
            value={statusIds}
            onChange={val => {
              setFilterValue('statusIds', val)
            }}
          />
        ) : null}

        <PrioritySelect
          all={true}
          width={130}
          value={priority}
          onChange={val => {
            setFilterValue('priority', val)
          }}
        />

        {assigneeEnable ? (
          <MultiMemberPicker
            all={true}
            value={updatedAssigneeIds}
            onChange={val => {
              setFilterValue('assigneeIds', val)
            }}
            compact={true}
            className="task-filter-member-picker"
          />
        ) : null}

        {isCalendarMode || isTeamMode ? null : (
          <ListPreset
            value={filter.groupBy}
            onChange={val => {
              updateGroupByFilter(val as ETaskFilterGroupByType)
            }}
            className="w-[150px] mr-1"
            width={150}
            options={[
              {
                id: ETaskFilterGroupByType.STATUS,
                title: 'Status',
                icon: '🚦'
              },
              {
                id: ETaskFilterGroupByType.ASSIGNEE,
                title: 'Assignees',
                icon: '🤓'
              },
              {
                id: ETaskFilterGroupByType.PRIORITY,
                title: 'Priority',
                icon: '🚩'
              }
              // { id: ETaskFilterGroupByType.WEEK, title: 'Week', icon: '📅' }
            ]}
          />
        )}

        {importEnable ? <TaskImport /> : null}
      </div>
    </div>
  )
}
