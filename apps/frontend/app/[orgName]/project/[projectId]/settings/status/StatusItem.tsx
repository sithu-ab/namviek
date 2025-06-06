import { StatusType, TaskStatus } from '@prisma/client'
import {
  projectStatusDel,
  projectStatusUpdate
} from '../../../../../../services/status'
import { useProjectStatusStore } from '../../../../../../store/status'
import { KeyboardEvent, useRef } from 'react'
import { HiOutlineBars3 } from 'react-icons/hi2'
import { Popover } from 'packages/ui-components/src/components/Controls'
import { colors } from './type'
import { IoIosClose } from 'react-icons/io'
import { confirmAlert, messageError, messageSuccess } from '@ui-components'
import { useUserRole } from '@/features/UserPermission/useUserRole'
import HasRole from '@/features/UserPermission/HasRole'
import { StatusItemType } from './StatusType'

interface IStatusItemProps {
  status: TaskStatus
}

export const StatusItem = ({ status }: IStatusItemProps) => {
  const { projectRole } = useUserRole()
  const { updateStatus, delStatus } = useProjectStatusStore()
  const inputRef = useRef<HTMLInputElement>(null)

  const onDeleteHandler = async (status: TaskStatus) => {
    confirmAlert({
      message: `All tasks with ${status.name} status will be moved to the backlog after this status is deleted. Are you sure you want to delete it?`,
      yes: () => {
        const { id } = status

        try {
          delStatus(id)
          projectStatusDel(id)
        } catch (error) {
          console.log(error)
          messageError('Delete status successfully')
        }
      }
    })
  }

  const onChangeNameHandler = async (
    e: KeyboardEvent<HTMLDivElement>,
    oldStatus: TaskStatus
  ) => {
    if (e.key !== 'Enter') return

    const target = e.target as HTMLInputElement
    const id = status.id
    const newStatus = {
      ...oldStatus,
      name: target.value
    }
    updateStatus(id, newStatus)
    inputRef?.current?.blur()
    await updateNewStatus(oldStatus, newStatus)
  }

  // sync new status infor to server
  const updateNewStatus = async (
    oldStatus: TaskStatus,
    newStatus: TaskStatus
  ) => {
    const id = status.id
    await projectStatusUpdate(newStatus).then(() => {
      messageSuccess('Update status successfully')
    }).catch(err => {
      console.log(`Update status failed: ${err}\nRollback to old value`)
      messageError('Status has been failed to sync ! 😥')
      updateStatus(id, oldStatus)
    })
  }

  const onColorChangeHandler = async (oldStatus: TaskStatus, color: string) => {
    const id = status.id
    const newStatus = {
      ...oldStatus,
      color
    }

    try {
      updateStatus(id, newStatus)
      await updateNewStatus(oldStatus, newStatus)
    } catch (error) {
      messageError('Update color error')
    }
  }

  const onChangeStatusType = async (type: StatusType) => {
    const id = status.id
    const newStatus = {
      ...status,
      type
    }

    try {
      updateStatus(id, newStatus)
      await updateNewStatus(status, newStatus)
    } catch (error) {
      messageError('Update status type error')
    }
  }

  const readOnly = projectRole === 'MEMBER' || projectRole === 'GUEST'

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="text-xl text-gray-500 cursor-grabbing">
          <HiOutlineBars3 className="text-gray-500" />
        </div>
        <Popover
          triggerBy={
            <div
              style={{ backgroundColor: status.color }}
              className="w-4 h-4 shrink-0 rounded cursor-pointer hover:opacity-90"></div>
          }
          content={
            <div className="grid grid-cols-6 gap-2 p-2 rounded bg-white border border-gray-30">
              {colors.map((color, index) => (
                <div
                  key={index}
                  style={{ backgroundColor: color }}
                  onClick={() => onColorChangeHandler(status, color)}
                  className="w-4 h-4 cursor-pointer rounded"></div>
              ))}
            </div>
          }
        />
        <input
          readOnly={readOnly}
          ref={inputRef}
          className="outline-none bg-transparent w-full text-gray-500 text-sm pr-8 py-3"
          onKeyDown={e => onChangeNameHandler(e, status)}
          defaultValue={status.name}
        />
        <StatusItemType type={status.type} onStatusType={onChangeStatusType} />
      </div>
      <HasRole projectRoles={['LEADER', 'MANAGER']}>
        <div className="absolute right-3 gap-2 hidden group-hover:flex ">
          <IoIosClose
            onClick={() => onDeleteHandler(status)}
            className="cursor-pointer w-5 h-5 bg-gray-100 dark:bg-gray-800 hover:bg-red-100 hover:text-red-400 rounded-md text-gray-500"
          />
        </div>
      </HasRole>
    </>
  )
}
