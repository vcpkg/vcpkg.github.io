/**
 * Vcpkg manifest file. See
 * https://github.com/microsoft/vcpkg/blob/master/docs/specifications/manifests.md.
 */
export type Manifest = {
  /**
   * A vcpkg repository commit for version control.
   */
  'builtin-baseline'?: string;
  /**
   * Features enabled by default with the package.
   */
  'default-features'?: string[];
  /**
   * Dependencies that are always required.
   */
  dependencies?: Array<DependencyObject | string>;
  description?: string[] | string;
  /**
   * Dependencies only required for developers (testing and the like).
   */
  'dev-dependencies'?: Array<DependencyObject | string>;
  /**
   * A url which points to the documentation of a package.
   */
  documentation?: string;
  /**
   * A map of features supported by the package
   */
  features?: { [key: string]: any };
  /**
   * A url which points to the homepage of a package.
   */
  homepage?: string;
  /**
   * An SPDX license expression at version 3.9.
   */
  license?: string;
  /**
   * An array of strings which contain the authors of a package
   */
  maintainers?: string[];
  /**
   * The name of the top-level package
   */
  name: string;
  /**
   * Version overrides for dependencies.
   */
  overrides?: Override[];
  'port-version'?: number;
  supports?: string;
  /**
   * A relaxed version string (1.2.3.4...)
   */
  version?: string;
  /**
   * A date version string (e.g. 2020-01-20)
   */
  'version-date'?: string;
  /**
   * A semantic version string. See https://semver.org/
   */
  'version-semver'?: string;
  /**
   * Text used to identify an arbitrary version
   */
  'version-string'?: string;
};

/**
 * Expanded form of a dependency with explicit features and platform.
 */
export type DependencyObject = {
  'default-features'?: boolean;
  features?: string[];
  host?: boolean;
  name: string;
  platform?: string;
  /**
   * Minimum required version
   */
  'version>='?: string;
};

/**
 * A version override.
 */
export type Override = {
  name: string;
  'port-version'?: number;
  version: string;
};

export type Versions = {
  versions: Version[];
};

export type Version = {
  'git-tree': string;
  /**
   * A relaxed version string (1.2.3.4...)
   */
  version?: string;
  /**
   * A date version string (e.g. 2020-01-20)
   */
  'version-date'?: string;
  /**
   * A semantic version string. See https://semver.org/
   */
  'version-semver'?: string;
  /**
   * Text used to identify an arbitrary version
   */
  'version-string'?: string;
  /**
   * An integer value that increases each time a vcpkg-specific change is made to the port.
   */
  'port-version': number;
};

export type StatusValue = 'pass' | 'fail' | 'skip';

export type Status = {
  'arm64-windows': StatusValue;
  'arm-uwp': StatusValue;
  'x64-linux': StatusValue;
  'x64-osx': StatusValue;
  'x64-uwp': StatusValue;
  'x64-windows': StatusValue;
  'x64-windows-static': StatusValue;
  'x64-windows-static-md': StatusValue;
  'x86-windows': StatusValue;
};

export interface Triplets {
  'built-in': string[];
  community: string[];
}

export type ManifestWithVersions = Manifest & Versions;
export type ManifestWithVersionsAndStatus = ManifestWithVersions & { status: Status };
export type ManifestWithVersionsAndStatusAndStars = ManifestWithVersionsAndStatus & {
  stars?: number;
};
