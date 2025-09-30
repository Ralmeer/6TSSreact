import { TextInput, Button, Group, Box, Select, LoadingOverlay, Text, Stack, Title, SegmentedControl, Paper, TagsInput, Table, Badge, MultiSelect, useCombobox } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconCalendar } from '@tabler/icons-react';
import { supabase } from '../../supabaseClient';
import { useEffect, useState } from 'react';


const AttendancePage = () => {
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [scouts, setScouts] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editScoutId, setEditScoutId] = useState('');
  const [newRecordDate, setNewRecordDate] = useState('');
  const [newSelectedAttendees, setNewSelectedAttendees] = useState([]);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [editActivityDate, setEditActivityDate] = useState('');
  const [editActivityType, setEditActivityType] = useState('');
  const [editCustomActivityName, setEditCustomActivityName] = useState('');
  const [editSelectedAttendees, setEditSelectedAttendees] = useState([]);
  const [originalCustomActivityName, setOriginalCustomActivityName] = useState('');

  const [newActivityType, setNewActivityType] = useState('');
  const [newCustomActivityName, setNewCustomActivityName] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc'); // New state for sorting order
  const [filterActivityType, setFilterActivityType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const newRecordForm = useForm({
    initialValues: {
      date: '',
      activityType: '',
      customActivityName: '',
      attendees: [],
    },

    validate: {
      date: (value) => (value ? null : 'Date is required'),
      activityType: (value) => (value ? null : 'Activity type is required'),
      attendees: (value) =>
        value.length > 0 ? null : 'At least one attendee is required',
    },
  });

  const fetchAttendanceRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(
          `
          *,
          attendance_scouts (scout_id, scouts (id, full_name))
        `
        )
        .order('date', { ascending: sortOrder === 'asc' });

      if (error) throw error;
      setAttendanceRecords(data);
    } catch (error) {
      console.error('Error fetching attendance records:', error.message);
      setError('Failed to fetch attendance records.');
    } finally {
      setLoading(false);
    }
  };

  const fetchScouts = async () => {
    try {
      const { data, error } = await supabase.from('scouts').select('id, full_name');
      if (error) throw error;
      setScouts(data);
    } catch (error) {
      console.error('Error fetching scouts:', error.message);
      setError('Failed to fetch scouts.');
    }
  };

  useEffect(() => {
    fetchAttendanceRecords();
    fetchScouts();
  }, [sortOrder]);

  const handleAddRecord = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (
      !newRecordDate ||
      !newActivityType ||
      newSelectedAttendees.length === 0
    ) {
      setError('Please fill in all required fields and select at least one attendee.');
      return;
    }

    if (newActivityType === 'Other' && !newCustomActivityName) {
      setError('Please enter a custom activity name when activity type is Other.');
      return;
    }

    const activityName = newActivityType === 'Other' ? newCustomActivityName : newActivityType;

    try {
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .insert([
          {
            date: newRecordDate,
            activity_type: newActivityType,
            custom_activity_name: newCustomActivityName,
          },
        ])
        .select();

      if (attendanceError) throw attendanceError;

      const newAttendanceId = attendanceData[0].id;

      const attendanceScoutsData = newSelectedAttendees.map((scoutId) => ({
        attendance_id: newAttendanceId,
        scout_id: scoutId,
      }));

      const { error: attendanceScoutsError } = await supabase
        .from('attendance_scouts')
        .insert(attendanceScoutsData);

      if (attendanceScoutsError) throw attendanceScoutsError;

      setMessage('Attendance record added successfully!');
      setNewRecordDate('');
      setNewActivityType('');
      setNewCustomActivityName('');
      setNewSelectedAttendees([]); // Clear selected attendees after submission
      fetchAttendanceRecords();
    } catch (err) {
      console.error('Error adding attendance record:', err.message);
      setError(err.message);
    }
  };

  const handleEditRecord = (recordId) => {
    const recordToEdit = attendanceRecords.find(record => record.id === recordId);
    if (recordToEdit) {
      setEditingRecordId(recordToEdit.id);
      setEditActivityDate(recordToEdit.date);
      setEditActivityType(recordToEdit.activity_type);
      setEditCustomActivityName(recordToEdit.custom_activity_name || '');
      setOriginalCustomActivityName(recordToEdit.custom_activity_name || '');
      setEditSelectedAttendees(recordToEdit.attendance_scouts.map(as => String(as.scouts.id)));
    }
  };

  const handleUpdateRecord = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!editingRecordId || !editActivityDate || !editActivityType || editSelectedAttendees.length === 0) {
      setError('Please fill in all required fields and select at least one attendee for the edited record.');
      return;
    }

    if (editActivityType === 'Other' && !editCustomActivityName) {
      setError('Please enter a custom activity name when activity type is Other.');
      return;
    }

    const activityName = editActivityType === 'Other' ? editCustomActivityName : editActivityType;

    try {
      // Update attendance record
      const { error: attendanceError } = await supabase
        .from('attendance')
        .update({
          date: editActivityDate,
          activity_type: editActivityType,
          custom_activity_name: editCustomActivityName,
        })
        .eq('id', editingRecordId);

      if (attendanceError) throw attendanceError;

      // Get current scouts for the attendance record
      const { data: currentAttendanceScouts, error: currentScoutsError } = await supabase
        .from('attendance_scouts')
        .select('scout_id')
        .eq('attendance_id', editingRecordId);

      if (currentScoutsError) throw currentScoutsError;

      const existingScoutIds = currentAttendanceScouts.map(s => s.scout_id);
      const selectedScoutIds = editSelectedAttendees.map(s => s.value);

      // Scouts to add
      const scoutsToAdd = selectedScoutIds.filter(scoutId => !existingScoutIds.includes(scoutId));
      if (scoutsToAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('attendance_scouts')
          .insert(scoutsToAdd.map(scoutId => ({
            attendance_id: editingRecordId,
            scout_id: scoutId,
          })));
        if (insertError) throw insertError;
      }

      // Scouts to remove
      const scoutsToRemove = existingScoutIds.filter(scoutId => !selectedScoutIds.includes(scoutId));
      if (scoutsToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('attendance_scouts')
          .delete()
          .eq('attendance_id', editingRecordId)
          .in('scout_id', scoutsToRemove);
        if (deleteError) throw deleteError;
      }

      setEditingRecordId(null);
      setEditActivityDate('');
      setEditActivityType('');
      setEditCustomActivityName('');
      setEditSelectedAttendees([]);
      setMessage('Attendance record updated successfully.');
      fetchAttendanceRecords();
    } catch (error) {
      console.error('Error updating attendance record:', error);
      setError(error.message);
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }
    setMessage(null);
    setError(null);
    try {
      // Delete associated attendance_scouts first
      const { error: deleteScoutsError } = await supabase
        .from('attendance_scouts')
        .delete()
        .eq('attendance_id', recordId);

      if (deleteScoutsError) throw deleteScoutsError;

      // Then delete the attendance record
      const { error: deleteRecordError } = await supabase
        .from('attendance')
        .delete()
        .eq('id', recordId);

      if (deleteRecordError) throw deleteRecordError;

      setMessage('Attendance record deleted successfully!');
      fetchAttendanceRecords();
    } catch (err) {
      console.error('Error deleting attendance record:', err.message);
      setError(err.message);
    }
  };

  const handleRemoveAttendee = (scoutIdToRemove, isEdit) => {
    if (isEdit) {
      setEditSelectedAttendees((current) =>
        current.filter((id) => id !== scoutIdToRemove)
      );
    } else {
      setNewSelectedAttendees((current) =>
        current.filter((id) => id !== scoutIdToRemove)
      );
    }
  };

  const filteredRecords = attendanceRecords.filter((record) => {
    const matchesActivityType = filterActivityType
      ? record.activity_type === filterActivityType
      : true;
    const matchesSearchQuery = searchQuery
      ? (record.custom_activity_name || record.activity_type)
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      : true;
    return matchesActivityType && matchesSearchQuery;
  });

  return (
    // <Stack p="md">
    //   <Title order={2} mb="md">Attendance Records</Title>
    //   {message && <Text color="green" mb="sm">{message}</Text>}
    //   {error && <Text color="red" mb="sm">{error}</Text>}

    //   <Paper withBorder shadow="md" p="md" mb="xl">
    //     <Title order={3} mb="md">Add New Attendance Record</Title>
    //     <form onSubmit={handleAddRecord}>
    //       <Stack>
    //         <TextInput
    //           label="Date"
    //           type="date"
    //           value={newRecordDate}
    //           onChange={(event) => setNewRecordDate(event.currentTarget.value)}
    //           required
    //         />
    //         <Select
    //           label="Activity Type"
    //           placeholder="Select activity type"
    //           data={['Meeting', 'Camps', 'Hikes', 'Service', 'Other', 'Swimming', 'Kayaking']}
    //           value={newActivityType}
    //           onChange={(value) => setNewActivityType(value)}
    //           required
    //         />
            
    //           <TextInput
    //             label="Custom Activity Name"
    //             placeholder="Enter custom activity name"
    //             value={newCustomActivityName}
    //             onChange={(event) => setNewCustomActivityName(event.currentTarget.value)}
    //             required
    //           />
            
    //         <Select
    //           label="Select Attendees"
    //           placeholder="Select scouts"
    //           data={scouts.map((scout) => ({ value: String(scout.id), label: scout.full_name }))}
    //           value={null}
    //           onChange={(value) => handleAttendeeChange(value)}
    //         />
    //         <TagsInput
    //           label="Selected Attendees"
    //           placeholder="No attendees selected"
    //           value={selectedAttendees.filter(Boolean).map((attendee) => attendee?.full_name ?? '')}
    //           onRemove={(value) => handleRemoveAttendee(selectedAttendees.find(attendee => attendee.full_name === value)?.id)}
    //           readOnly
    //         />
    //         <Button type="submit">Add Record</Button>
    //       </Stack>
    //     </form>
    //   </Paper>

    //   <Stack>
    //     <Title order={3} mb="md">Existing Attendance Records</Title>
    //     <Group mb="md">
    //       <SegmentedControl
    //         value={sortOrder}
    //         onChange={setSortOrder}
    //         data={[
    //           { label: 'Date Asc', value: 'asc' },
    //           { label: 'Date Desc', value: 'desc' },
    //         ]}
    //       />
    //       <Select
    //         label="Filter by Activity Type"
    //         placeholder="Select activity type"
    //         data={['Meeting', 'Camps', 'Hikes', 'Service', 'Other', 'Swimming', 'Kayaking']}
    //         value={filterActivityType}
    //         onChange={(value) => setFilterActivityType(value)}
    //         clearable
    //       />
    //       <TextInput
    //         label="Search Activity Name"
    //         placeholder="Search by activity name"
    //         value={searchQuery}
    //         onChange={(event) => setSearchQuery(event.currentTarget.value)}
    //       />
    //     </Group>
    //     {loading ? (
    //       <Text>Loading attendance records...</Text>
    //     ) : (
    //       <Table striped highlightOnHover withTableBorder withColumnBorders>
    //         <Table.Thead>
    //           <Table.Tr>
    //             <Table.Th>Date</Table.Th>
    //             <Table.Th>Activity Type</Table.Th>
    //             <Table.Th>Activity Name</Table.Th>
    //             <Table.Th>Attendees</Table.Th>
    //             <Table.Th>Actions</Table.Th>
    //           </Table.Tr>
    //         </Table.Thead>
    //         <Table.Tbody>
    //           {attendanceRecords.map((record) => (
    //             <Table.Tr key={record.id}>
    //               <Table.Td>
    //                 {editingRecordId === record.id ? (
    //                   <TextInput
    //                     type="date"
    //                     value={editActivityDate}
    //                     onChange={(event) => setEditActivityDate(event.currentTarget.value)}
    //                   />
    //                 ) : (
    //                   record.date
    //                 )}
    //               </Table.Td>
    //               <Table.Td>
    //                 {editingRecordId === record.id ? (
    //                   <Select
    //                     placeholder="Select activity type"
    //                     data={['Meeting', 'Camps', 'Hikes', 'Service', 'Other', 'Swimming', 'Kayaking']}
    //                     value={editActivityType}
    //                     onChange={(value) => setEditActivityType(value)}
    //                   />
    //                 ) : (
    //                   record.activity_type
    //                 )}
    //               </Table.Td>
    //               <Table.Td>
    //                 {editingRecordId === record.id ? (
    //                   <TextInput
    //                     placeholder="Activity name"
    //                     value={editCustomActivityName}
    //                     onChange={(event) => setEditCustomActivityName(event.currentTarget.value)}
    //                   />
    //                 ) : (
    //                   record.custom_activity_name || record.activity_type
    //                 )}
    //               </Table.Td>
    //               <Table.Td>{record.attendance_scouts.length}</Table.Td>
    //               <Table.Td>
    //                 {editingRecordId === record.id ? (
    //                   <Stack>
    //                     <Select
    //                       label="Add Attendees"
    //                       placeholder="Select scouts"
    //                       data={scouts.map((scout) => ({ value: String(scout.id), label: scout.full_name }))}
    //                       value={null} // Controlled by handleAttendeeChange
    //                       onChange={(value) => handleAttendeeChange(value, true)}
    //                       searchable
    //                       clearable
    //                       multiple
    //                     />
    //                     <Box mt="md">
    //                       <Text size="sm" weight={500}>Selected Attendees</Text>
    //                       {editSelectedAttendees.length === 0 ? (
    //                         <Text size="sm" color="dimmed">No attendees selected</Text>
    //                       ) : (
    //                         <Group spacing="xs" mt="xs">
    //                           {editSelectedAttendees.map(attendee => (
    //                             <Badge
    //                               key={attendee.id}
    //                               rightSection={<Text size="xs" style={{ cursor: 'pointer' }} onClick={() => handleRemoveAttendee(attendee.id, true)}>x</Text>}
    //                             >
    //                               {attendee.full_name}
    //                             </Badge>
    //                           ))}
    //                         </Group>
    //                       )}
    //                     </Box>
    //                   
    //                     <Group justify="flex-end" mt="md">
    //                       <Button onClick={handleUpdateRecord} size="xs">Save</Button>
    //                       <Button onClick={() => setEditingRecordId(null)} size="xs" variant="outline">Cancel</Button>
    //                     </Group>
    //                   </Stack>
    //                 ) : (
    //                   <Group>
    //                     <Button onClick={() => handleEditRecord(record.id)} size="xs">Edit</Button>
    //                     <Button onClick={() => handleDeleteRecord(record.id)} size="xs" color="red">Delete</Button>
    //                   </Group>
    //                 )
    //               </Table.Td>
    //             </Table.Tr>
    //           ))}
    //         </Table.Tbody>
    //       </Table>
    //     )}
    //   </Stack>
    // </Stack>
    <Stack p="md">
      <Title order={2} mb="md">Attendance Records</Title>
      {message && <Text color="green" mb="sm">{message}</Text>}
      {error && <Text color="red" mb="sm">{error}</Text>}

      <Paper withBorder shadow="md" p="md" mb="xl">
        <Title order={3} mb="md">Add New Attendance Record</Title>
        <form onSubmit={handleAddRecord}>
          <Stack>
            <TextInput
              label="Date"
              type="date"
              value={newRecordDate}
              onChange={(event) => setNewRecordDate(event.currentTarget.value)}
              required
            />
            <MultiSelect
              label="Activity Type"
              placeholder="Select activity type"
              data={[
                { value: 'Meeting', label: 'Meeting' },
                { value: 'Camps', label: 'Camps' },
                { value: 'Hikes', label: 'Hikes' },
                { value: 'Service', label: 'Service' },
                { value: 'Other', label: 'Other' },
                { value: 'Swimming', label: 'Swimming' },
                { value: 'Kayaking', label: 'Kayaking' },
              ]}
              value={newActivityType ? [newActivityType] : []}
              onChange={(value) => setNewActivityType(value[0] || '')}
              required
              searchable
              clearable
              nothingFoundMessage="No activity types found"
            />
            {/* {newActivityType === 'Other' && ( */}
              <TextInput
                label="Custom Activity Name"
                placeholder="Enter custom activity name"
                value={newCustomActivityName}
                onChange={(event) => setNewCustomActivityName(event.currentTarget.value)}
                required
              />
            {/* )} */}
            <MultiSelect
              label="Select Attendees"
              placeholder="Select scouts"
              data={scouts.map((scout) => ({
                value: String(scout.id),
                label: scout.full_name,
              }))}
              value={newSelectedAttendees || []}
              onChange={(values) => {
                setNewSelectedAttendees(values);
                combobox.closeDropdown();
              }}
              searchable
              clearable
              nothingFoundMessage="No scouts found"
              comboboxProps={{
                onOptionSubmit: (val) => {
                  setNewSelectedAttendees((current) =>
                    current.includes(val)
                      ? current.filter((v) => v !== val)
                      : [...current, val]
                  );
                },
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && combobox.dropdownOpened) {
                  event.preventDefault();
                  combobox.selectFirstOption();
                }
              }}
            />
            {/* <TagsInput
              label="Selected Attendees"
              placeholder="No attendees selected"
              value={newSelectedAttendees.filter(Boolean).map((attendee) => attendee?.full_name ?? '')}
              onRemove={(value) => handleRemoveAttendee(newSelectedAttendees.find(attendee => attendee.full_name === value)?.id, false)}
            /> */}
            <Button type="submit">Add Record</Button>
          </Stack>
        </form>
      </Paper>

      <Stack>
        <Title order={3} mb="md">Existing Attendance Records</Title>
        <Group mb="md">
          <SegmentedControl
            value={sortOrder}
            onChange={setSortOrder}
            data={[
              { label: 'Date Asc', value: 'asc' },
              { label: 'Date Desc', value: 'desc' },
            ]}
          />
          <MultiSelect
            label="Filter by Activity Type"
            placeholder="Select activity type"
            data={['Meeting', 'Camps', 'Hikes', 'Service', 'Other', 'Swimming', 'Kayaking']}
            value={filterActivityType ? [filterActivityType] : []}
            onChange={(value) => setFilterActivityType(value[0] || '')}
            clearable
            searchable
            nothingFoundMessage="No activity types found"
          />
          <TextInput
            label="Search Activity Name"
            placeholder="Search by activity name"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
          />
        </Group>
        {loading ? (
          <Text>Loading attendance records...</Text>
        ) : (
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Activity Type</Table.Th>
                <Table.Th>Activity Name</Table.Th>
                <Table.Th>Number of Attendees</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredRecords.map((record) => (
                <Table.Tr key={record.id}>
                  <Table.Td>
                    {editingRecordId === record.id ? (
                      <DateInput
                        value={editActivityDate ? new Date(editActivityDate) : null}
                        onChange={(date) => setEditActivityDate(date ? date.toISOString().split('T')[0] : '')}
                        valueFormat="YYYY-MM-DD"
                        label="Date"
                        placeholder="Date"
                        icon={<IconCalendar size={18} stroke={1.5} />}
                      />
                    ) : (
                      record.date
                    )}
                  </Table.Td>
                  <Table.Td>
                    {editingRecordId === record.id ? (
                      <MultiSelect
                        placeholder="Select activity type"
                        data={['Meeting', 'Camps', 'Hikes', 'Service', 'Other', 'Swimming', 'Kayaking']}
                        value={editActivityType ? [editActivityType] : []}
                        onChange={(value) => setEditActivityType(value[0] || '')}
                        searchable
                        clearable
                        nothingFoundMessage="No activity types found"
                      />
                    ) : (
                      record.activity_type
                    )}
                  </Table.Td>
                  <Table.Td>
                    {editingRecordId === record.id ? (
                      <> 
                        <TextInput
                          placeholder="Activity name"
                          value={editCustomActivityName}
                          onChange={(event) => setEditCustomActivityName(event.currentTarget.value)}
                        />
                      </>
                    ) : (
                      record.custom_activity_name || record.activity_type
                    )}
                  </Table.Td>
                  <Table.Td>{record.attendance_scouts.length}</Table.Td>
                  <Table.Td>
                    {editingRecordId === record.id ? (
                      <Stack>
                        <MultiSelect
                          label="Select Attendees"
                          placeholder="Select scouts"
                          data={scouts.map((scout) => ({
                            value: String(scout.id),
                            label: scout.full_name,
                          }))}
                          value={editSelectedAttendees || []}
                          onChange={(values) => setEditSelectedAttendees(values)}
                          searchable
                          clearable
                          nothingFoundMessage="No scouts found"
                        />
                        {/* <Box mt="md">
                          <Text size="sm" weight={500}>Selected Attendees</Text>
                          {editSelectedAttendees.length === 0 ? (
                            <Text size="sm" color="dimmed">No attendees selected</Text>
                          ) : (
                            <Group spacing="xs" mt="xs">
                              {editSelectedAttendees.map(attendee => (
                                <Badge
                                  key={attendee.id}
                                  color="blue"
                                  size="lg"
                                  radius="sm"
                                  rightSection={
                                    <ActionIcon
                                      size="xs"
                                      color="blue"
                                      radius="xl"
                                      variant="transparent"
                                      onClick={() => handleRemoveAttendee(attendee.id, true)}
                                    >
                                      <IconX size={14} />
                                    </ActionIcon>
                                  }
                                >
                                  {attendee.full_name}
                                </Badge>
                              ))}
                            </Group>
                          )}
                        </Box> */}
                      
                        <Group justify="flex-end" mt="md">
                          <Button onClick={handleUpdateRecord} size="xs">Save</Button>
                          <Button onClick={() => setEditingRecordId(null)} size="xs" variant="outline">Cancel</Button>
                        </Group>
                      </Stack>
                    ) : (
                      <Group>
                        <Button onClick={() => handleEditRecord(record.id)} size="xs">Edit</Button>
                        <Button onClick={() => handleDeleteRecord(record.id)} size="xs" color="red">Delete</Button>
                      </Group>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Stack>
    </Stack>
  );
};

export default AttendancePage;