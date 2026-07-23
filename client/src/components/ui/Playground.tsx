import React, { useState } from 'react';
import { Button } from './Button/Button';
import { Input } from './Input/Input';
import { Select } from './Select/Select';
import { Card } from './Card/Card';
import { Badge } from './Badge/Badge';
import type { CampaignStatus } from './Badge/Badge';
import { Modal } from './Modal/Modal';
import { Spinner } from './Spinner/Spinner';
import { Tooltip } from './Tooltip/Tooltip';
import './Playground.css';

/**
 * Component Playground View to test and showcase all UI primitives.
 */
export const Playground: React.FC = () => {
  // Modal visibility state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSize, setModalSize] = useState<'sm' | 'md' | 'lg'>('md');

  // Input states
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  // Select states
  const [selectValue, setSelectValue] = useState('');

  // Campaign statuses list
  const campaignStatuses: CampaignStatus[] = [
    'Active',
    'Funding',
    'Funded',
    'Harvested',
    'Disputed',
    'Resolved',
    'Settled',
    'Failed',
  ];

  const selectOptions = [
    { value: 'active', label: 'Active Status' },
    { value: 'pending', label: 'Pending Processing' },
    { value: 'completed', label: 'Completed Action' },
  ];

  return (
    <div className="ui-playground">
      <header className="ui-playground-header">
        <h1>Component Playground</h1>
        <p className="ui-playground-subtitle">
          Interactive preview of primitives, layout grids, and visual design
          assets.
        </p>
      </header>

      {/* Spinner Section */}
      <section className="ui-playground-section">
        <h2>Spinner</h2>
        <div className="ui-playground-grid ui-playground-grid--flex">
          <div className="ui-playground-item">
            <span className="ui-playground-item-label">Small</span>
            <Spinner size="sm" />
          </div>
          <div className="ui-playground-item">
            <span className="ui-playground-item-label">Medium (Default)</span>
            <Spinner size="md" />
          </div>
          <div className="ui-playground-item">
            <span className="ui-playground-item-label">Large</span>
            <Spinner size="lg" />
          </div>
          <div className="ui-playground-item">
            <span className="ui-playground-item-label">Secondary Color</span>
            <Spinner variant="secondary" />
          </div>
          <div className="ui-playground-item ui-playground-item--dark">
            <span className="ui-playground-item-label">Light Variant</span>
            <Spinner variant="light" />
          </div>
        </div>
      </section>

      {/* Button Section */}
      <section className="ui-playground-section">
        <h2>Button</h2>
        <div className="ui-playground-grid">
          <div>
            <h3>Variants</h3>
            <div className="ui-playground-flex">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </div>

          <div>
            <h3>Sizes</h3>
            <div className="ui-playground-flex">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>

          <div>
            <h3>States</h3>
            <div className="ui-playground-flex">
              <Button disabled>Disabled</Button>
              <Button isLoading>Loading State</Button>
              <Button variant="secondary" isLoading>
                Loading Secondary
              </Button>
              <Button
                variant="outline"
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                }
              >
                With Icon Left
              </Button>
              <Button
                variant="primary"
                iconPosition="right"
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                }
              >
                With Icon Right
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Input Section */}
      <section className="ui-playground-section">
        <h2>Input</h2>
        <div className="ui-playground-grid ui-playground-grid--2col">
          <div className="ui-playground-card-style">
            <h3>Standard Inputs</h3>
            <div className="ui-playground-stack">
              <Input
                label="Email Address"
                placeholder="you@example.com"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (
                    e.target.value.length > 0 &&
                    !e.target.value.includes('@')
                  ) {
                    setInputError('Invalid email format (missing @)');
                  } else {
                    setInputError('');
                  }
                }}
                error={inputError || undefined}
                helperText="Enter a valid email address with an @ sign."
                required
              />
              <Input
                label="Disabled Field"
                placeholder="Can't type here"
                disabled
              />
            </div>
          </div>

          <div className="ui-playground-card-style">
            <h3>Input Variants</h3>
            <div className="ui-playground-stack">
              <Input
                label="Password"
                type="password"
                placeholder="Enter security passphrase"
              />
              <Input label="Numeric Field" type="number" placeholder="0.00" />
            </div>
          </div>
        </div>
      </section>

      {/* Select Section */}
      <section className="ui-playground-section">
        <h2>Select</h2>
        <div className="ui-playground-grid ui-playground-grid--2col">
          <div className="ui-playground-card-style">
            <h3>Dropdown Layout</h3>
            <div className="ui-playground-stack">
              <Select
                label="Status Choice"
                options={selectOptions}
                value={selectValue}
                onChange={(e) => setSelectValue(e.target.value)}
                placeholderOption="Choose a status option..."
                required
              />
              <p className="ui-playground-text-muted">
                Selected Value: {selectValue || 'None'}
              </p>
            </div>
          </div>

          <div className="ui-playground-card-style">
            <h3>Dropdown States</h3>
            <div className="ui-playground-stack">
              <Select
                label="Disabled Selection"
                options={selectOptions}
                value=""
                disabled
                placeholderOption="Dropdown unavailable"
              />
              <Select
                label="Error Selection"
                options={selectOptions}
                value=""
                error="Selecting a status is mandatory"
                placeholderOption="Choose a status option..."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Badge Section */}
      <section className="ui-playground-section">
        <h2>Badge</h2>
        <div className="ui-playground-grid">
          <div>
            <h3>CampaignStatus Values</h3>
            <div className="ui-playground-flex">
              {campaignStatuses.map((status) => (
                <Badge key={status} status={status} />
              ))}
            </div>
          </div>

          <div>
            <h3>Generic Palette</h3>
            <div className="ui-playground-flex">
              <Badge variant="neutral">Neutral</Badge>
              <Badge variant="default">Default Info</Badge>
              <Badge variant="success">Success Status</Badge>
              <Badge variant="warning">Warning Notice</Badge>
              <Badge variant="error">Critical Error</Badge>
              <Badge variant="info">System Info</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Card Section */}
      <section className="ui-playground-section">
        <h2>Card</h2>
        <div className="ui-playground-grid ui-playground-grid--3col">
          <Card title="Standard Card" description="Basic static card setup">
            <p>This is a default Card component showing textual data.</p>
          </Card>

          <Card
            title="Interactive Card"
            description="Hover to view dynamic transitions"
            isClickable
            onClick={() => alert('Interactive card click')}
          >
            <p>
              Clicking this card will trigger an alert action. Notice the hover
              translate animations.
            </p>
          </Card>

          <Card
            title="Complete Layout Card"
            description="Containing custom footer layout"
            footer={
              <>
                <Button variant="ghost" size="sm">
                  Cancel
                </Button>
                <Button variant="primary" size="sm">
                  Submit
                </Button>
              </>
            }
          >
            <p>
              Perfect for form blocks, details review, or product summary cards.
            </p>
          </Card>
        </div>
      </section>

      {/* Tooltip Section */}
      <section className="ui-playground-section">
        <h2>Tooltip</h2>
        <div className="ui-playground-grid ui-playground-grid--flex">
          <div className="ui-playground-item">
            <span className="ui-playground-item-label">Top placement</span>
            <Tooltip content="Tooltip message on top" position="top">
              <Button variant="outline">Hover Top</Button>
            </Tooltip>
          </div>
          <div className="ui-playground-item">
            <span className="ui-playground-item-label">Bottom placement</span>
            <Tooltip content="Tooltip message on bottom" position="bottom">
              <Button variant="outline">Hover Bottom</Button>
            </Tooltip>
          </div>
          <div className="ui-playground-item">
            <span className="ui-playground-item-label">Left placement</span>
            <Tooltip content="Tooltip message on left" position="left">
              <Button variant="outline">Hover Left</Button>
            </Tooltip>
          </div>
          <div className="ui-playground-item">
            <span className="ui-playground-item-label">Right placement</span>
            <Tooltip content="Tooltip message on right" position="right">
              <Button variant="outline">Hover Right</Button>
            </Tooltip>
          </div>
        </div>
      </section>

      {/* Modal Section */}
      <section className="ui-playground-section">
        <h2>Modal</h2>
        <div className="ui-playground-grid ui-playground-grid--flex">
          <div className="ui-playground-item">
            <Button
              variant="primary"
              onClick={() => {
                setModalSize('sm');
                setIsModalOpen(true);
              }}
            >
              Open Small Modal
            </Button>
          </div>
          <div className="ui-playground-item">
            <Button
              variant="secondary"
              onClick={() => {
                setModalSize('md');
                setIsModalOpen(true);
              }}
            >
              Open Medium Modal (Default)
            </Button>
          </div>
          <div className="ui-playground-item">
            <Button
              variant="outline"
              onClick={() => {
                setModalSize('lg');
                setIsModalOpen(true);
              }}
            >
              Open Large Modal
            </Button>
          </div>
        </div>
      </section>

      {/* Modal Render */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Sample ${modalSize.toUpperCase()} Dialog`}
        size={modalSize}
      >
        <div className="ui-playground-modal-body">
          <p>
            This modal is fully accessible. You can close it by clicking the
            backdrop overlay, pressing the
            <strong>Escape</strong> key on your keyboard, or activating the
            close button.
          </p>
          <p>
            Focus looping is handled: tab navigation remains inside this
            container.
          </p>
          <div className="ui-playground-modal-actions">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel Action
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Acknowledge
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
