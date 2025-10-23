'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface LeaveFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
  user: any;
}

interface LeaveFormData {
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export default function LeaveForm({ onSubmit, onCancel, loading, user }: LeaveFormProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<LeaveFormData>();
  const [duration, setDuration] = useState(0);

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  // Calculate duration when dates change
  const calculateDuration = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setDuration(diffDays);
    }
  };

  const onFormSubmit = (data: LeaveFormData) => {
    onSubmit(data);
  };

  const leaveTypes = [
    { value: 'sick', label: 'Sick Leave', description: 'For medical reasons and health issues' },
    { value: 'vacation', label: 'Vacation Leave', description: 'For personal time off and holidays' },
    { value: 'personal', label: 'Personal Leave', description: 'For personal or family matters' },
    { value: 'maternity', label: 'Maternity Leave', description: 'For expecting mothers' },
    { value: 'paternity', label: 'Paternity Leave', description: 'For new fathers' },
  ];

  const getAvailableBalance = (type: string) => {
    return user?.leaveBalance?.[type] || 0;
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-8 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Apply for Leave</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Leave Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leave Type *
            </label>
            <div className="grid grid-cols-1 gap-3">
              {leaveTypes.map((type) => (
                <label key={type.value} className="relative flex cursor-pointer">
                  <input
                    type="radio"
                    value={type.value}
                    {...register('type', { required: 'Leave type is required' })}
                    className="sr-only"
                  />
                  <div className="flex-1 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors peer-checked:border-blue-500 peer-checked:bg-blue-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{type.label}</div>
                        <div className="text-sm text-gray-500">{type.description}</div>
                      </div>
                      <div className="text-sm text-gray-600">
                        Available: {getAvailableBalance(type.value)} days
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                {...register('startDate', { 
                  required: 'Start date is required',
                  onChange: calculateDuration
                })}
                className="input-field"
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                {...register('endDate', { 
                  required: 'End date is required',
                  onChange: calculateDuration,
                  validate: value => {
                    if (startDate && value < startDate) {
                      return 'End date must be after start date';
                    }
                    return true;
                  }
                })}
                className="input-field"
                min={startDate || new Date().toISOString().split('T')[0]}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Duration Display */}
          {duration > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">Total Leave Duration:</span>
                <span className="text-lg font-bold text-blue-700">{duration} day(s)</span>
              </div>
              {watch('type') && duration > getAvailableBalance(watch('type')) && (
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ You are requesting more days than your available balance.
                </p>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Leave *
            </label>
            <textarea
              rows={4}
              {...register('reason', { 
                required: 'Reason is required',
                minLength: { value: 10, message: 'Reason must be at least 10 characters' }
              })}
              className="input-field"
              placeholder="Please provide a detailed reason for your leave application..."
            />
            {errors.reason && (
              <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
            )}
          </div>

          {/* Emergency Contact */}
          <div className="border-t pt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact (Optional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name
                </label>
                <input
                  type="text"
                  {...register('emergencyContact.name')}
                  className="input-field"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  {...register('emergencyContact.phone')}
                  className="input-field"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship
                </label>
                <input
                  type="text"
                  {...register('emergencyContact.relationship')}
                  className="input-field"
                  placeholder="Relationship"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}