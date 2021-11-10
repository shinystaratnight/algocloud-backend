import PermissionChecker from '../../services/user/permissionChecker';
import ApiResponseHandler from '../apiResponseHandler';
import Permissions from '../../security/permissions';
import SuperadminRepository from '../../database/repositories/superadminRepository';

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(
      Permissions.values.userReadBySuperadmin,
    );

    const payload = await SuperadminRepository.fetchAllUsers(
      req.query,
      req,
    );

    await ApiResponseHandler.success(req, res, payload);
  } catch (error) {
    await ApiResponseHandler.error(req, res, error);
  }
};
