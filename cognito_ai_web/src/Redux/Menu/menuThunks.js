import { createAsyncThunk } from '@reduxjs/toolkit'
import {apiRequest} from "../../utils/helpers/ApiHelper";

export const fetchUnits = createAsyncThunk(
  'menu/fetchUnits',
  async ({ ClientId }) => {
    const resp = await apiRequest('/api/GetBusinessUnitMasterByClientId', { ClientId })
    return resp.ResponseData.map(unit => ({
      id: `unit-${unit.BusinessUnitId}`,
      name: unit.BusinessUnitName,
      route: `/units/${unit.BusinessUnitId}`,
      type: 'unit',
    }))
  }
)

export const fetchProjects = createAsyncThunk(
  'menu/fetchProjects',
  async ({ ClientId, BusinessUnitId }) => {
    const resp = await apiRequest('/client-projects/GetClientProjectsByClientId', { ClientId, BusinessUnitId })
    return resp.ResponseData.map(project => ({
      id: `project-${project.ProjectId}`,
      name: project.ProjectName,
      route: `/projects/${project.ProjectId}`,
      type: 'project',
    }))
  }
)
